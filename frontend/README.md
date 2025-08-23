# ReSeich - AI-Powered Research Platform

ReSeich is a cutting-edge research platform that leverages AI agents, blockchain technology, and the Sei Network to revolutionize how research is conducted, shared, and monetized..

## 🚀 Quick Start

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd reseich-team/frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env.local
   # Edit .env.local with your actual values
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Environment Configuration

Before running the project, you need to set up your environment variables. Copy `env.example` to `.env.local` and fill in your actual values:

### **Required Environment Variables**

#### **Dynamic SDK**

- `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` - Your Dynamic environment ID

#### **Supabase Configuration**

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Supabase publishable key

#### **n8n Workflow Integration**

- `N8N_WEBHOOK_URL` - Single webhook URL for all n8n workflows
  - Uses `form-id` property to route to different workflows:
    - `research` - Research processing workflow
    - `chat` - AI chat workflow
    - `email` - Email delivery workflow

#### **Email Service (SendGrid)**

- `SENDGRID_API_KEY` - SendGrid API key for email delivery
- `EMAIL_FROM` - Sender email address
- `EMAIL_FROM_NAME` - Sender display name

#### **Sei Network (Optional)**

- `SEI_RPC_URL` - Sei Network RPC endpoint
- `SEI_CHAIN_ID` - Sei Network chain ID
- `SEI_EXPLORER_URL` - Sei Network explorer URL

#### **File Storage**

- `SUPABASE_STORAGE_BUCKET` - Supabase storage bucket name
- `SUPABASE_STORAGE_URL` - Supabase storage URL

#### **Security & Rate Limiting**

- `RATE_LIMIT_MAX_REQUESTS` - Maximum requests per window
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds

### **Example .env.local**

```bash
# Copy from env.example and fill in your values
cp env.example .env.local
```

### **n8n Workflow Setup**

Your n8n workflows should check the `form-id` property in the webhook payload to determine which workflow to execute:

1. **Research Workflow**: Triggers when `form-id: 'research'`
2. **Chat Workflow**: Triggers when `form-id: 'chat'`
3. **Email Workflow**: Triggers when `form-id: 'email'`

### Testing the API Routes

All API routes are now implemented and ready for testing:

- `POST /api/research/submit` - Submit new research
- `GET/POST /api/research/status/[id]` - Check/update research status
- `POST /api/payments/sei` - Process SEI payments
- `POST /api/email/send` - Send research results via email
- `POST /api/upload/file` - Upload research files
- `POST /api/chat/send` - Send chat messages
- `POST /api/chat/response/[session_id]` - Receive AI chat responses

## 🏗️ Architecture

### Frontend

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **React Hook Form** with Zod validation

### Backend

- **Supabase** for database and storage
- **n8n** for AI workflow orchestration
- **OpenAI & Perplexity** for AI research
- **SendGrid** for email delivery

### Blockchain

- **Sei Network** for payments and NFTs
- **Wallet integration** via Dynamic SDK
- **SEI cryptocurrency** for transactions

## 🎯 Key Features

- **AI-Powered Research**: Multi-depth research using OpenAI and Perplexity
- **Blockchain Integration**: SEI payments and NFT tokenization
- **Marketplace**: Buy/sell private research items
- **Demo Mode**: Try before you buy with IP-based limitations
- **Real-time Updates**: WebSocket integration for live status updates
- **File Management**: Secure storage and PDF generation
- **Email Notifications**: Automated research result delivery

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### Integration Tests

```bash
npm run test:integration
```

### E2E Tests

```bash
npm run test:e2e
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Manual Deployment

```bash
npm run build
npm start
```

## 📚 Documentation

- [Project Overview](./PROJECT_OVERVIEW.md)
- [Product Requirements](./PRD_MVP.md)
- [Features Breakdown](./FEATURES.md)
- [Development Plan](./DEVELOPMENT_PLAN.md)
- [Development Roadmap](./ROADMAP.md)
- [Database Specifications](./DATABASE_SPECS.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the development plan

---

**ReSeich** - Revolutionizing research through AI and blockchain technology.
