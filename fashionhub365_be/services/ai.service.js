const axios = require("axios");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");
const dataRetrievalService = require("./dataRetrieval.service");

/**
 * Generate a response using OpenRouter API with Project Data Context (RAG)
 */
const generateResponse = async (prompt, history = []) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new ApiError(httpStatus.BAD_REQUEST, "OpenRouter API Key is missing in .env");
    }

    // List of models to try. Free models on OpenRouter are stable for basic use.
    const modelsToTry = [
        "google/gemini-2.0-flash-lite-preview-02-05:free",
        "huggingfaceh4/zephyr-7b-beta:free",
        "mistralai/mistral-7b-instruct:free",
        "google/gemini-2.0-pro-exp-02-05:free",
        "liquid/lfm-40b:free",
        "openrouter/auto"
    ];

    let lastError = null;

    // 1. Get real-world context from DB based on user prompt
    const dbContext = await dataRetrievalService.getRelevantContext(prompt);
    console.log(`[AI] Context retrieved (${dbContext.length} chars)`);

    // 2. Build the system prompt with context
    const systemPrompt = `Bạn là trợ lý ảo chính thức của sàn thương mại điện tử FashionHub365. 
Hãy trả lời thân thiện, chuyên nghiệp bằng tiếng Việt. 

YÊU CẦU QUAN TRỌNG: 
- Bạn CHỈ ĐƯỢC PHÉP dùng thông tin từ "CƠ SỞ DỮ LIỆU" bên dưới để trả lời về sản phẩm, giá cả và cửa hàng.
- Tuyệt đối KHÔNG tự bịa ra thông tin không có trong dữ liệu được cung cấp.
- Trả lời NGẮN GỌN, ĐÚNG TRỌNG TÂM câu hỏi. 
- Không giải thích dài dòng, không lặp lại thông tin không cần thiết.
- Nếu cung cấp danh sách sản phẩm, hãy LUÔN chèn thẻ sản phẩm ở cuối câu trả lời theo định dạng: {{PRODUCT_CARD|Tên|Giá|productId|Link_Ảnh}}.
- productId trong định dạng thẻ sản phẩm phải là giá trị "ID" có trong dữ liệu (dạng ObjectId như  6819...).
- Bạn được phép chèn tối đa 3 thẻ sản phẩm trong một câu trả lời.

${dbContext}

Dựa trên dữ liệu trên và lịch sử hội thoại, hãy trả lời câu hỏi của người dùng ngắn gọn nhất có thể. 
Hãy dùng dữ liệu thực tế. Nếu giới thiệu sản phẩm, ĐỪNG quên dùng định dạng thẻ {{PRODUCT_CARD|Tên|Giá|productId|Link_Ảnh}} ở cuối. productId là giá trị "ID" trong dữ liệu.
Nếu hỏi về giá, chỉ trả lời giá và kèm thẻ sản phẩm.`;

    for (const modelName of modelsToTry) {
        try {
            console.log(`[AI] Attempting with OpenRouter model: ${modelName}`);

            const response = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    model: modelName,
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...history.map(msg => ({
                            role: msg.role === 'model' ? 'assistant' : 'user',
                            content: msg.text || (msg.parts && msg.parts[0]?.text) || ''
                        })),
                        { role: "user", content: prompt }
                    ],
                    headers: {
                        "HTTP-Referer": "http://localhost:3000",
                        "X-Title": "FashionHub365 AI Assistant",
                    }
                },
                {
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json"
                    },
                    timeout: 20000 // 20s timeout
                }
            );

            if (response.data.choices && response.data.choices[0]?.message) {
                console.log(`[AI] Success with model: ${modelName}`);
                return response.data.choices[0].message.content;
            }
        } catch (error) {
            lastError = error;
            const status = error.response?.status;
            const errMsg = error.response?.data?.error?.message || error.message;

            console.warn(`[AI] Model ${modelName} failed (Status ${status}):`, errMsg);

            if (status === 401) {
                throw new ApiError(httpStatus.UNAUTHORIZED, "OpenRouter API Key is invalid hoặc hết hạn.");
            }
            if (status === 429) continue;
            continue;
        }
    }

    const finalMsg = lastError?.response?.data?.error?.message || lastError?.message || "Không thể kết nối với hệ thống AI.";
    throw new ApiError(httpStatus.BAD_GATEWAY, `Hệ thống AI đang bận: ${finalMsg}`);
};

module.exports = { generateResponse };
