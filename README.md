# ReSeich 🔬

> **AI-Powered Research Platform on Sei Network**

ReSeich is a decentralized research platform that combines advanced AI capabilities with blockchain technology to revolutionize how research is conducted, shared, and monetized. Built on Sei Network, it enables researchers to access AI-powered research tools, monetize their work through a marketplace, and tokenize research results as NFTs.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Git
- Sei Network wallet (for payments and authentication)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/reseich-team.git
cd reseich-team/frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase and OpenAI API keys

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Demo Mode
Try the platform without registration! Demo users get:
- 1 free research (any depth)
- 10 AI chat messages
- Access to public research library

## ✨ Key Features

- **🤖 AI-Powered Research**: Multi-depth research with OpenAI integration
- **💳 Sei Network Integration**: Cryptocurrency payments and wallet authentication
- **🏪 Research Marketplace**: Buy/sell private research results
- **🔒 Privacy Control**: Choose between public and private research
- **📚 Research Library**: Access to public research and personal collections
- **🎯 Credit System**: Pay-per-research with SEI tokens
- **📧 Email Delivery**: Get research results delivered to your inbox
- **🖼️ NFT Tokenization**: Tokenize public research as ERC-721 NFTs

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Supabase (database, auth, storage)
- **AI Integration**: OpenAI + Perplexity + n8n workflow automation
- **Blockchain**: Sei Network (payments, NFTs)
- **Styling**: Tailwind CSS + shadcn/ui components

## 🔧 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_publishable_key
OPENAI_API_KEY=your_openai_api_key
N8N_WEBHOOK_URL=your_n8n_webhook_url
```

## 📱 Pages & Features

- **Home**: Public research library and platform overview
- **Chat**: AI-powered research assistance with markdown support
- **Research**: Advanced research form with depth options
- **Library**: Personal research collection and management
- **Marketplace**: Buy/sell private research results
- **User Dashboard**: Credits, transactions, and settings

## 🚧 Development Status

This project is currently in development for the [AI Accelathon Hackathon](https://dorahacks.io/hackathon/aiaccelathon/detail) on DoraHacks.

## 🤝 Contributing

This is a hackathon project. For questions or collaboration, please reach out to the team.

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for the AI research community on Sei Network**