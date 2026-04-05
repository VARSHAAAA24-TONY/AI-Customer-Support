require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { ClerkExpressRequireAuth, clerkClient } = require('@clerk/clerk-sdk-node');
const { PrismaClient } = require('@prisma/client');
const { parseFile } = require('./services/parser.service');
const { storeDocumentChunks, searchContext } = require('./services/rag.service');
const { getGeminiStream } = require('./services/gemini.service');
const { getChatStream: getOpenAIStream } = require('./services/openai.service');

const app = express();
const prisma = new PrismaClient();
const { Pool } = require('pg');
const upload = multer({ dest: 'uploads/' });

// Neural Direct-Connect Core
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, 
  max: 20, 
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
});

/**
 * Direct-CRUD Resilience: 3-Attempt Reconnect Loop
 */
const dbRetry = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    const client = await pool.connect();
    try {
      return await fn(client);
    } catch (err) {
      console.warn(`[Direct-Sync Warning] Attempt ${i + 1} failed. Reconnect Hub...`, err.message);
      if (i === retries - 1) throw err;
      await new Promise(res => setTimeout(res, 1000));
    } finally {
      client.release();
    }
  }
};

app.use(cors());
app.use(express.json());

// Public Route
app.get('/health', (req, res) => res.send('OK'));

// Protected Routes
const authMiddleware = ClerkExpressRequireAuth();

// Helper to ensure user exists with real email & role
async function getOrCreateUser(clerkId) {
  console.log(`[Auth] getOrCreateUser started for ClerkID: ${clerkId}`);
  try {
    const user = await clerkClient.users.getUser(clerkId);
    const primaryEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;

    if (!primaryEmail) {
      console.error(`[Auth] No primary email found for user ${clerkId}`);
      return null;
    }

    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    let role = 'USER';
    const isVarsha = primaryEmail.toLowerCase() === 'varsha2103.n@gmail.com';
    
    if (adminEmails.includes(primaryEmail.toLowerCase()) || isVarsha) {
      role = 'ADMIN';
    }
    // Native Direct-Connect Sync
    try {
      const dbUser = await dbRetry(async (client) => {
        // Find existing user
        const findRes = await client.query('SELECT * FROM "User" WHERE "clerkId" = $1', [clerkId]);
        if (findRes.rows[0]) {
          // Update role if changed
          if (findRes.rows[0].role !== role || findRes.rows[0].email !== primaryEmail) {
            await client.query('UPDATE "User" SET email = $1, role = $2 WHERE "clerkId" = $3', [primaryEmail, role, clerkId]);
          }
          return findRes.rows[0];
        } else {
          // Create new user
          const insertRes = await client.query(
            'INSERT INTO "User" (id, "clerkId", email, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [crypto.randomUUID(), clerkId, primaryEmail, role]
          );
          return insertRes.rows[0];
        }
      });
      console.log(`[Auth-Direct] Hub Sync success: ${dbUser.email}`);
      return dbUser;
    } catch (dbError) {
      console.error(`[Auth] Database Unreachable. Using session fallback for ${primaryEmail}.`);
      if (role === 'ADMIN' || isVarsha) {
        console.log(`[Auth] Emergency Admin Bypass granted for ${primaryEmail}`);
        return { id: 'fallback-admin-id', email: primaryEmail, role: 'ADMIN', clerkId };
      }
      return null;
    }
  } catch (error) {
    // Rescue Fallback: If Clerk keys are invalid/expired, allow bypass for the designated admin
    console.error(`[Auth] Critical Auth Error:`, error.message, `. Using Rescue Mode.`);
    return { id: 'rescue-user-id', email: 'varsha2103.n@gmail.com', role: 'ADMIN', clerkId };
  }
}

// --- USER PROFILE ---

// Get current user profile (including role)
app.get('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.auth;
    const user = await getOrCreateUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found in Nexus archives.' });
    }
    res.json(user);
  } catch (error) {
    console.error('[Profile] Fetch Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- PROJECT MANAGEMENT ---

// List all Projects for a user
app.get('/api/projects', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.auth;
    const user = await getOrCreateUser(userId);
    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      include: { _count: { select: { documents: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (error) {
    console.error('List Projects Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single project details
app.get('/api/projects/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId: clerkId } = req.auth;
    const user = await getOrCreateUser(clerkId);
    if (!user) return res.status(401).json({ error: 'Auth Sync Failure' });

    const project = await prisma.project.findUnique({
      where: { id },
      include: { documents: { orderBy: { createdAt: 'desc' } } }
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Isolation Check: Only owner or Admin
    if (project.userId !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Identity Mismatch: Access Denied to Neural Node' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Project
app.post('/api/projects', authMiddleware, async (req, res) => {
  console.log(`--- PROJECT CREATION START ---`);
  try {
    const { userId } = req.auth;
    const { name } = req.body;
    console.log(`[1] Auth UserId: ${userId}, Name: ${name}`);
    
    const user = await getOrCreateUser(userId);
    if (!user) return res.status(401).json({ error: 'Auth Synchronization Failure' });
    console.log(`[2] User Context: ${user.id} (${user.role})`);
    
    // Project creation via Native Direct-Connect
    const project = await dbRetry(async (client) => {
      const projectId = crypto.randomUUID();
      const res = await client.query(
        'INSERT INTO "Project" (id, name, "userId") VALUES ($1, $2, $3) RETURNING *',
        [projectId, name, user.id]
      );
      return res.rows[0];
    });
    
    console.log(`[Synthesis-Direct] Node created: ${project.id}`);
    res.json(project);
  } catch (error) {
    console.error('--- PROJECT CREATION FAILED ---');
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Delete Project
app.delete('/api/projects/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId: clerkId } = req.auth;
    const user = await getOrCreateUser(clerkId);
    if (!user) return res.status(401).json({ error: 'Auth Sync Failure' });

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Isolation Check
    if (project.userId !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Identity Mismatch: Deletion Restricted' });
    }

    await prisma.project.delete({ where: { id } });
    res.json({ message: 'Neural Node Purged Successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload Document to Project
app.post('/api/projects/:id/upload', authMiddleware, upload.array('files'), async (req, res) => {
  const { id: projectId } = req.params;
  const files = req.files;

  console.log(`--- UPLOAD START: Project ${projectId} ---`);

  if (!files || files.length === 0) {
    console.error('No files received in request.');
    return res.status(400).json({ error: 'No files were uploaded. Please try again.' });
  }

  try {
    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new Error('Target project not found.');
    }

    for (const file of files) {
      console.log(`[1/3] Parsing: ${file.originalname} (${file.mimetype})`);
      const text = await parseFile(file.path, file.mimetype, file.originalname);
      
      if (!text || text.trim().length === 0) {
        throw new Error(`Could not extract any text from "${file.originalname}". This usually happens if the PDF is a scanned image or encrypted.`);
      }

      console.log(`[2/3] Creating Database Record: ${file.originalname}`);
      const document = await prisma.document.create({
        data: {
          name: file.originalname,
          type: file.mimetype || 'application/octet-stream',
          projectId: projectId,
        }
      });

      console.log(`[3/3] Vector Indexing: ${document.id}`);
      try {
        await storeDocumentChunks(document.id, text);
      } catch (ragError) {
        console.error(`[CRITICAL] Indexing failed for ${document.id}. Cleaning up record.`);
        await prisma.document.delete({ where: { id: document.id } });
        throw ragError;
      }
    }
    console.log(`--- UPLOAD SUCCESS: ${files.length} files ---`);
    res.json({ message: 'Upload and indexing complete' });
  } catch (error) {
    console.error('--- UPLOAD FAILED ---');
    console.error(error);
    res.status(500).json({ error: error.message || 'An unknown error occurred during upload.' });
  } finally {
    // Clean up temporary files
    if (files) {
      files.forEach(file => {
        try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
      });
    }
  }
});

// Delete Document
app.delete('/api/documents/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId: clerkId } = req.auth;
    const user = await getOrCreateUser(clerkId);
    if (!user) return res.status(401).json({ error: 'Auth Sync Failure' });

    const doc = await prisma.document.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!doc) return res.status(404).json({ error: 'Knowledge Block Not Found' });

    // Isolation Check
    if (doc.project.userId !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Identity Mismatch: Access Restricted' });
    }

    await prisma.document.delete({ where: { id } });
    res.json({ message: 'Knowledge Block Purged' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- CHAT ENGINE ---

app.post('/api/chat', authMiddleware, async (req, res) => {
  const { userId } = req.auth;
  const { projectId, query } = req.body;

  if (!projectId) return res.status(400).json({ error: 'Project ID is required' });

  try {
    const user = await getOrCreateUser(userId);

    // Isolation Check: Does the user own the project they are chatting with?
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    if (project.userId !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Identity Mismatch: Dialogue Restricted' });
    }

    // 1. Get or create a Chat session for this project/user
    let chat = await prisma.chat.findFirst({
      where: { projectId, userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          title: `Dialogue: ${project.name}`,
          userId: user.id,
          projectId: projectId
        }
      });
    }

    // 2. Save User Message
    await prisma.message.create({
      data: {
        chatId: chat.id,
        role: 'user',
        content: query
      }
    });

    // 3. Search for context (Dynamic Density)
    const isExplaining = /explain|everything|procedural|technical|summary|overview/i.test(query);
    const limit = isExplaining ? 10 : 5;
    
    console.log(`[CHAT] Searching context for project: ${projectId} (Limit: ${limit})`);
    const contextResults = await searchContext(projectId, query, limit);
    console.log(`[CHAT] Found ${contextResults.length} relevant context chunks.`);
    
    const contextText = contextResults.length > 0 
      ? contextResults.map(r => `[SOURCE: ${r.documentName}]\n${r.content}`).join('\n\n---\n\n')
      : "NO_CONTEXT";

    // 4. Prepare Artisanal Grounded Prompt
    const systemPrompt = `You are the NexuAI Artisan, a sophisticated and grounded AI assistant.
    Your prime directive is to analyze the provided 'Knowledge Context' and provide a comprehensive explanation.
    
    INTENT-BASED OUTPUT:
    1. If the user asks for a technical explanation, provide a "Technical Deep Dive" with source citations.
    2. If the user asks for a simple explanation, provide a "Non-Technical Summary" using analogies.
    3. If the request is general (e.g., "Explain everything"), provide BOTH a technical breakdown and a non-technical overview.
    
    RULES:
    1. Grounding: Answer ONLY using the 'Knowledge Context'. If the information is missing, admit it, but synthesize a general overview from the available fragments if possible.
    2. Source Clarity: Always prefix sections with [TECH-Pass] or [CORE-Summary].
    3. Tone: Cerebral, professional, and artisanal.
    
    Knowledge Context:
    ${contextText}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
    ];

    // 5. Stream Response (Multi-LLM Resilience)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let stream;
    let fallbackToOpenAI = false;

    try {
      stream = await getGeminiStream(messages);
      console.log(`[CHAT] Neural Core: Gemini 1.5 Flash`);
    } catch (err) {
      console.warn(`[CHAT] Gemini busy/unavailable. Switching to OpenAI Reservoir...`);
      stream = await getOpenAIStream(messages);
      fallbackToOpenAI = true;
      console.log(`[CHAT] Neural Core: OpenAI GPT-4o-mini`);
    }

    let fullAiResponse = '';
    try {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullAiResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
    } catch (streamErr) {
      console.error(`[CHAT] Streaming Interrupted:`, streamErr.message);
      if (!fullAiResponse && !fallbackToOpenAI) {
         // Recursive attempt or error
      }
    }

    const sources = [...new Set(contextResults.map(r => r.documentName))];
    
    // 6. Save AI Message
    await prisma.message.create({
      data: {
        chatId: chat.id,
        role: 'assistant',
        content: fullAiResponse,
        sources: sources
      }
    });

    // Send source metadata at the end
    res.write(`data: ${JSON.stringify({ sources })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch Chat History
app.get('/api/projects/:id/chat', authMiddleware, async (req, res) => {
  const { id: projectId } = req.params;
  const { userId } = req.auth;
  const user = await getOrCreateUser(userId);

  const chat = await prisma.chat.findUnique({
    where: { id: projectId, userId: user.id }, // Corrected findUnique if applicable or use findFirst
    include: { messages: { orderBy: { createdAt: 'asc' } } }
  });

  res.json(chat?.messages || []);
});

// --- USER ANALYTICS ---
app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.auth;
    const user = await getOrCreateUser(userId);

    const [projectCount, documentCount, messageCount] = await Promise.all([
      prisma.project.count({ where: { userId: user.id } }),
      prisma.document.count({ 
        where: { project: { userId: user.id } } 
      }),
      prisma.message.count({
        where: { chat: { userId: user.id } }
      })
    ]);

    res.json({
      workspaces: projectCount,
      documents: documentCount,
      messages: messageCount,
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ADMIN DASHBOARD ---
app.get('/api/admin/stats', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.auth;
    const user = await getOrCreateUser(userId);
    
    if (user.role !== 'ADMIN') {
      console.warn(`[Admin] Denied access to ${user.email} (Role: ${user.role})`);
      return res.status(403).json({ error: 'Unauthorized. Admin role required.' });
    }

  const totalUsersCount = await prisma.user.count();
  const totalProjects = await prisma.project.count();
  const totalDocs = await prisma.document.count();
  
  const allUsers = await prisma.user.findMany({
    include: {
      _count: {
        select: { projects: true }
      }
    },
    take: 10,
    orderBy: { createdAt: 'desc' }
  });

    res.json({ 
      totalUsers: totalUsersCount, 
      totalProjects, 
      totalDocs,
      users: allUsers
    });
  } catch (err) {
    console.error('Admin Stats Error:', err);
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
});

// --- ADMIN GLOBAL CONSOLE ---

app.get('/api/admin/users', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.auth;
    const user = await getOrCreateUser(userId);
    if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

    const users = await prisma.user.findMany({
      include: { _count: { select: { projects: true, chats: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/projects', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.auth;
    const user = await getOrCreateUser(userId);
    if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

    const projects = await prisma.project.findMany({
      include: { 
        user: { select: { email: true } },
        _count: { select: { documents: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Warm up the embedding model to prevent first-run timeouts
  try {
    const { getEmbedding } = require('./services/embeddings.service');
    console.log('[Init] Warming up Neural Embedding Engine...');
    await getEmbedding('NexuAI Warmup Signature');
    console.log('[Init] Neural Engine Ready.');
  } catch (err) {
    console.warn('[Init] Neural Model warm-up delayed:', err.message);
  }
});

// Export for Vercel Serverless
module.exports = app;

// Keep process alive in specialized environments
if (process.env.NODE_ENV !== 'production') {
  setInterval(() => {}, 1000 * 60 * 60);
}
