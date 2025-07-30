# Backend API Testing Guide

## Prerequisites
1. Start the backend server: `cd backend && yarn dev`
2. Ensure you have your Google AI API key in `.env` file:
   ```
   GOOGLE_AI_API_KEY=your_google_ai_api_key_here
   PORT=3001
   ```
3. **IMPORTANT**: Now using native `@google/genai` package for better performance and streaming

## Test Commands

### 1. Health Check
```bash
curl -X GET http://localhost:3001/ping
```
**Expected:** `pong`

---

### 2. Email CRUD Operations

#### Get All Emails
```bash
curl -X GET http://localhost:3001/emails \
  -H "Content-Type: application/json"
```

#### Create a New Email
```bash
curl -X POST http://localhost:3001/emails \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "cc": "cc@example.com",
    "bcc": "bcc@example.com",
    "subject": "Test Email",
    "body": "This is a test email body."
  }'
```

#### Get Email by ID (replace {id} with actual ID)
```bash
curl -X GET http://localhost:3001/emails/1 \
  -H "Content-Type: application/json"
```

#### Update Email (replace {id} with actual ID)
```bash
curl -X PUT http://localhost:3001/emails/1 \
  -H "Content-Type: application/json" \
  -d '{
    "to": "updated@example.com",
    "subject": "Updated Test Email",
    "body": "This is an updated email body."
  }'
```

#### Delete Email (replace {id} with actual ID)
```bash
curl -X DELETE http://localhost:3001/emails/1 \
  -H "Content-Type: application/json"
```

---

### 3. AI Email Generation (Non-Streaming)

#### Simple Sales Email Generation
```bash
curl -X POST http://localhost:3001/ai/generate-email-simple \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Generate a sales email for a new CRM software to a tech startup CEO",
    "recipientInfo": "Fast-growing tech startup, 50 employees, needs better customer management"
  }'
```

#### Simple Follow-up Email Generation
```bash
curl -X POST http://localhost:3001/ai/generate-email-simple \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Follow up on our meeting last Tuesday about the partnership proposal"
  }'
```

---

### 4. AI Email Generation (Streaming) - Most Important Test

#### Streaming Sales Email Generation
```bash
curl -X POST http://localhost:3001/ai/generate-email \
  -H "Content-Type: application/json" \
  -H "Accept: text/plain" \
  --no-buffer \
  -d '{
    "prompt": "Create a sales pitch for our new AI-powered email assistant to marketing directors",
    "recipientInfo": "Marketing director at mid-size company, interested in automation tools"
  }'
```

#### Streaming Follow-up Email Generation
```bash
curl -X POST http://localhost:3001/ai/generate-email \
  -H "Content-Type: application/json" \
  -H "Accept: text/plain" \
  --no-buffer \
  -d '{
    "prompt": "Send a polite follow-up about the demo we scheduled for next week"
  }'
```

#### Advanced Streaming Test with Verbose Output
```bash
curl -X POST http://localhost:3001/ai/generate-email \
  -H "Content-Type: application/json" \
  -H "Accept: text/plain" \
  --no-buffer \
  -v \
  -d '{
    "prompt": "Write a sales email about our new project management tool to a busy executive",
    "recipientInfo": "C-level executive, values efficiency, short on time"
  }'
```

---

## Expected Streaming Response Format

The streaming endpoint should return Server-Sent Events in this order:

```
data: {"type": "assistant_type", "data": "sales"}

data: {"type": "subject", "data": "Quick Demo: AI Email Assistant"}

data: {"type": "body", "data": "Hi! Transform your marketing with AI. 5-minute demo? Boost efficiency instantly. Worth your time!"}

data: {"type": "complete"}
```

### Key Improvements with @google/genai:
- ✅ **Direct Gemini integration** - No middleware overhead
- ✅ **Native structured output** - Using `responseSchema` with JSON
- ✅ **Better streaming** - Real-time chunks from `generateContentStream`
- ✅ **Zod validation** - Additional type safety on top of schemas
- ✅ **Progressive parsing** - Handles partial JSON during streaming

---

## Testing Error Cases

#### Missing Prompt
```bash
curl -X POST http://localhost:3001/ai/generate-email-simple \
  -H "Content-Type: application/json" \
  -d '{}'
```
**Expected:** `400 Bad Request` with error message

#### Invalid Email ID
```bash
curl -X GET http://localhost:3001/emails/999 \
  -H "Content-Type: application/json"
```
**Expected:** `404 Not Found`

#### Missing Required Email Fields
```bash
curl -X POST http://localhost:3001/emails \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com"
  }'
```
**Expected:** `400 Bad Request` for missing subject/body

---

## Performance Testing

#### Test Multiple Concurrent Requests
```bash
# Run this in multiple terminals simultaneously
for i in {1..5}; do
  curl -X POST http://localhost:3001/ai/generate-email-simple \
    -H "Content-Type: application/json" \
    -d "{
      \"prompt\": \"Generate sales email #$i for cloud storage solution\"
    }" &
done
wait
```

#### Streaming Performance Test
```bash
time curl -X POST http://localhost:3001/ai/generate-email \
  -H "Content-Type: application/json" \
  --no-buffer \
  -d '{
    "prompt": "Create a comprehensive sales proposal for enterprise software"
  }'
```

---

## Debugging Tips

1. **Check Server Logs**: Watch the terminal where `yarn dev` is running
2. **Verify API Key**: Ensure `GOOGLE_AI_API_KEY` is set correctly
3. **Database Issues**: Run `yarn migrate` if database queries fail
4. **CORS Issues**: Check that requests include proper headers
5. **Streaming Issues**: Use `--no-buffer` flag and check Content-Type headers

