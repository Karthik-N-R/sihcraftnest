CraftNest

AI-Driven Market Linkage & Smart Cataloging for Marginalized Artisans

CraftNest is a web-based prototype developed for Smart India Hackathon 2026 – Problem Statement 26090 under the Heritage & Culture theme.

The project explores how AI can reduce the difficulty of bringing traditional craft products into the digital marketplace. Instead of requiring artisans to manually create detailed online listings, CraftNest combines image-based craft identification, regional-language voice input, speech processing, and AI-assisted catalogue generation.

What CraftNest Does

Product Image → Craft Identification → Voice Input → Speech Processing → AI Catalogue Generation → Artisan Review → Marketplace Listing

Core Features

Image-based craft identification using an EfficientNetB0-based TensorFlow/Keras classifier.

Voice-first product description so artisans can describe products instead of typing.

Tamil and Hindi speech processing using Sarvam AI Saaras.

AI catalogue generation using Google Gemini for product title, description, category, materials, tags, care instructions, dimensions, and suggested price.

Artisan review before publishing AI-generated information.

Marketplace prototype for browsing published products.

Technology Stack

Frontend: Next.js, React

Styling: Tailwind CSS

AI / LLM: Google Gemini

Speech AI: Sarvam AI Saaras

Image Classification: TensorFlow / Keras, EfficientNetB0

Programming: JavaScript / Python

Project Structure

sihcraftnest/
├── craftnest/
│   ├── models/        # Trained ML model files
│   ├── public/        # Static assets
│   ├── scripts/       # Python ML/inference scripts
│   ├── src/           # Next.js application source
│   ├── package.json
│   └── README.md
├── package-lock.json
└── README.md

Running the Project

cd craftnest
npm install
npm run dev

Open http://localhost:3000 in your browser.

Environment Variables

The AI integrations require the appropriate API credentials to be configured in the local environment.

Do not commit API keys or other secrets to GitHub.

Refer to the application source and environment configuration for the required variables.

Current Prototype Scope

The current implementation demonstrates the core artisan-to-market workflow:

Image-based craft identification

Regional-language voice input

Speech processing

AI-assisted catalogue generation

Artisan review and publishing

Marketplace browsing

Production-level capabilities such as persistent database storage, real payment-gateway integration, production authentication, and full marketplace infrastructure require further implementation.

Future Scope

Market Readiness Score

Explainable pricing recommendations

Capacity-aware buyer matching

Similar-product recommendations

Seller sales insights based on views, likes, shares, enquiries, and orders

Payment gateway integration

Order tracking and delivery location

Persistent database and production authentication

Expansion of the craft-classification model to additional craft categories

Problem Statement

SIH26090 – AI-Driven Market Linkage & Smart Cataloging Mobile Application for Marginalized Artisans

The project aims to reduce digital-market barriers faced by marginalized artisans and help convert their traditional craft products into structured, market-ready digital listings.

Team

Crafted Minds

Karthik N R

Yashwanth

Nikesh S

Rishibalan

Shivani V

Srihari

Note

CraftNest is an academic/prototype project developed as part of Smart India Hackathon 2026.
