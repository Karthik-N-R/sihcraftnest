import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

export async function POST(req) {
  try {
    const body = await req.json();
    const { 
      mode, 
      targetField, 
      craftType, 
      confidence, 
      category: inputCategory, 
      region, 
      tags, 
      transcript, 
      language 
    } = body;

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();

    if (!apiKey) {
      console.error('GEMINI_API_KEY is not configured in server environment');
      return NextResponse.json({ error: 'GEMINI_API_KEY is missing or empty in server environment (.env.local).' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const candidateModels = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-2.5-flash"];
    // MODE 2: TARGETED GEMINI EXTRACTION FOR A SINGLE MISSING FIELD
    if (mode === 'targeted' || targetField) {
      if (!targetField || !['size', 'quantity', 'price'].includes(targetField)) {
        return NextResponse.json({ error: 'Invalid or missing targetField for targeted extraction' }, { status: 400 });
      }

      if (!transcript || !transcript.trim()) {
        return NextResponse.json({ error: 'Empty transcript provided for targeted extraction' }, { status: 400 });
      }

      let targetedSchema;
      if (targetField === 'quantity') {
        targetedSchema = {
          type: SchemaType.OBJECT,
          properties: {
            quantity: {
              type: SchemaType.NUMBER,
              nullable: true,
              description: "Extracted numeric quantity of available items (e.g. 40)."
            }
          },
          required: ["quantity"]
        };
      } else if (targetField === 'price') {
        targetedSchema = {
          type: SchemaType.OBJECT,
          properties: {
            price: {
              type: SchemaType.NUMBER,
              nullable: true,
              description: "Extracted seller's actual selling price in INR as a number (e.g. 1200)."
            }
          },
          required: ["price"]
        };
      } else if (targetField === 'size') {
        targetedSchema = {
          type: SchemaType.OBJECT,
          properties: {
            size: {
              type: SchemaType.STRING,
              nullable: true,
              description: "Extracted size or dimensions string (e.g. '12 x 18 inches' or '10 cm diameter')."
            },
            sizeStatus: {
              type: SchemaType.STRING,
              nullable: true,
              description: "'estimated' if measurement is informal/approximate, otherwise 'exact'."
            }
          },
          required: ["size"]
        };
      }

      const targetedPrompt = `
You are extracting ONLY a single product specification field for CraftNest marketplace.
Requested Field: "${targetField}"
Artisan Spoken Response (English Translation): "${transcript}"

CRITICAL INSTRUCTIONS:
- Extract ONLY the requested field value for "${targetField}".
- Do NOT output title, description, category, craft, tags, or any other fields.
${targetField === 'quantity' ? '- Extract the numeric quantity available (e.g. 40 from "I have forty pieces").' : ''}
${targetField === 'price' ? '- Extract the seller\'s actual selling price in Indian Rupees (INR) as a numeric integer (e.g. 1200 from "I want to sell each for 1200 rupees").' : ''}
${targetField === 'size' ? '- Extract the size/dimensions string (e.g. "12 x 18 inches"). If the artisan phrased it informally or approximately (e.g. "about 12 inches"), set sizeStatus to "estimated", otherwise "exact".' : ''}
`;

      let targetedResultData = null;
      let lastErr = null;

      for (const modelName of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: targetedSchema,
            }
          });

          const result = await model.generateContent(targetedPrompt);
          const responseText = result.response.text();
          targetedResultData = JSON.parse(responseText);
          if (targetedResultData) break;
        } catch (err) {
          lastErr = err;
          console.error(`Targeted Gemini error with model ${modelName}:`, err.message);
        }
      }

      if (!targetedResultData) {
        return NextResponse.json({ 
          error: `Failed targeted extraction using Gemini: ${lastErr?.message || 'Model request failed'}` 
        }, { status: 500 });
      }

      return NextResponse.json(targetedResultData);
    }

    // MODE 1: INITIAL GEMINI EXTRACTION
    const schema = {
      type: SchemaType.OBJECT,
      properties: {
        title: {
          type: SchemaType.STRING,
          description: "A catchy, authentic product title in English celebrating the craft."
        },
        description: {
          type: SchemaType.STRING,
          description: "A polished, respectful product description in English based strictly on what the artisan described. Do not invent unmentioned facts."
        },
        category: {
          type: SchemaType.STRING,
          description: "The product craft category (e.g. Folk Art, Mural Art, Miniature Art, Pottery & Ceramics, Woven Textiles, Woodcraft, Handmade Jewelry, Block Print Art)."
        },
        price: {
          type: SchemaType.NUMBER,
          nullable: true,
          description: "Seller's actual selling price in Indian Rupees (INR) if explicitly stated by artisan. If NOT stated, return null."
        },
        suggestedPrice: {
          type: SchemaType.NUMBER,
          nullable: true,
          description: "Suggested market price in Indian Rupees (INR) as a numeric integer (e.g. 2500). AI market recommendation."
        },
        quantity: {
          type: SchemaType.NUMBER,
          nullable: true,
          description: "Available quantity/stock count if explicitly stated by artisan. If NOT stated, return null."
        },
        size: {
          type: SchemaType.STRING,
          nullable: true,
          description: "Product size or dimensions if explicitly stated by artisan (e.g. '12 x 18 inches'). If NOT stated, return null."
        },
        sizeStatus: {
          type: SchemaType.STRING,
          nullable: true,
          description: "'estimated' if measurement was informal/approximate, 'exact' if exact, otherwise null."
        },
        currency: {
          type: SchemaType.STRING,
          description: "Currency code. MUST ALWAYS be 'INR'."
        },
        materials: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "List of materials explicitly mentioned by artisan or evident from craft tags. Return empty array if not mentioned."
        },
        colour: {
          type: SchemaType.STRING,
          nullable: true,
          description: "Primary colour(s) if explicitly mentioned by artisan, otherwise null."
        },
        dimensions: {
          type: SchemaType.STRING,
          nullable: true,
          description: "Product size or dimensions if explicitly mentioned, otherwise null."
        },
        careInstructions: {
          type: SchemaType.STRING,
          nullable: true,
          description: "Care instructions if explicitly mentioned by artisan, otherwise null."
        },
        seoTags: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "List of 4-6 relevant SEO tags for marketplace discovery."
        }
      },
      required: ["title", "description", "category", "currency", "materials", "seoTags"]
    };

    let lastGeminiError = null;
    let listingData = null;

    const langName = language === 'ta-IN' ? 'Tamil' : language === 'hi-IN' ? 'Hindi' : (language || 'Local Indian language');

    const prompt = `
You are an expert e-commerce catalog writer for CraftNest, an Indian artisan marketplace connecting traditional artisans to buyers.
An artisan has provided the following verified details about their creation:

Detected Craft Type: ${craftType || 'Handcrafted Item'}
Category: ${inputCategory || 'Folk Art'}
Region/Origin: ${region || 'India'}
Detected Craft Tags: ${Array.isArray(tags) && tags.length > 0 ? tags.join(', ') : 'None'}
Artisan Description (English Translation from spoken ${langName}): "${transcript || ''}"

CRITICAL RULES:
1. CURRENCY & PRICING: Prices must be in Indian Rupees (INR). Set currency to "INR".
2. SELLER PRICE VS SUGGESTED PRICE:
   - "price" is the seller's actual selling price. ONLY set "price" if the artisan explicitly mentioned their selling price in the transcript. Otherwise, set "price" to null.
   - "suggestedPrice" is your recommended market price in INR.
   - NEVER automatically copy suggestedPrice into price.
3. NEVER INVENT FACTUAL PRODUCT INFORMATION:
   - If "size" / "dimensions" were NOT explicitly stated by the artisan, set size and dimensions to null. Do NOT fabricate fake dimensions like "12 x 18 inches".
   - If "quantity" was NOT explicitly stated by the artisan, set quantity to null. Do NOT fabricate fake quantity like 5.
   - If "price" was NOT explicitly stated by the artisan, set price to null.
   - Never fabricate dimensions, materials, care instructions, or specific numbers unless supported by the artisan transcript.
4. LANGUAGE & TONE: Write the title and description in clean, dignified, professional English while respecting authentic artisan heritage.
`;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
          }
        });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        listingData = JSON.parse(responseText);
        if (listingData) break;
      } catch (err) {
        lastGeminiError = err;
        console.error(`Gemini API error with model ${modelName}:`, err.message);
      }
    }

    if (!listingData) {
      return NextResponse.json({ 
        error: `Failed to generate product listing using Gemini: ${lastGeminiError?.message || 'Model request failed'}` 
      }, { status: 500 });
    }

    // Enforce INR currency and sync size/dimensions
    listingData.currency = 'INR';
    if (!listingData.size && listingData.dimensions) {
      listingData.size = listingData.dimensions;
    } else if (listingData.size && !listingData.dimensions) {
      listingData.dimensions = listingData.size;
    }

    if (!listingData.category) {
      listingData.category = inputCategory || craftType || 'Handcrafted Item';
    }

    return NextResponse.json(listingData);

  } catch (error) {
    console.error('Gemini API exception during listing generation:', error.message);
    return NextResponse.json({ 
      error: `Gemini API exception: ${error.message}` 
    }, { status: 500 });
  }
}
