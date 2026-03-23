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

    // Chỉ giữ lại những mô hình cực kỳ nhanh và ổn định để tránh việc phải đợi timeout từ các mô hình lỗi/chậm
    const modelsToTry = [
        "google/gemini-2.0-flash-lite-preview-02-05:free", // Rất nhanh, phù hợp cho Chatbot
        "huggingfaceh4/zephyr-7b-beta:free",               // Dự phòng ổn định
        "openrouter/auto"                                  // Fallback an toàn nhất
    ];

    let lastError = null;

    // 1. Get real-world context from DB based on user prompt
    const dbContext = await dataRetrievalService.getRelevantContext(prompt);
    console.log(`[AI] Context retrieved (${dbContext.length} chars)`);

    // 2. Build the system prompt with context
    const systemPrompt = `Bạn là trợ lý bán hàng bằng TIẾNG VIỆT, tập trung cao độ và siêu ngắn gọn.

QUY TẮC KHẮT KHE:
1. KHÔNG LẠC ĐỀ: Chỉ tư vấn ĐÚNG loại sản phẩm khách tìm. Nếu KHÁCH HỎI "ÁO" mà dữ liệu (Sản phẩm nổi bật / Liên quan) toàn QUẦN hoặc GIÀY -> TUYỆT ĐỐI KHÔNG GỢI Ý. Chỉ được đáp: "Hiện shop chưa có mẫu này, bạn có thể xem các món đồ khác nhé".
2. TÌM KIẾM THÔNG MINH: Đọc Tên và Mô tả. Biết cách suy luận (Sơ mi, T-shirt, Polo = Áo). Nếu khớp yêu cầu thì mới chèn thẻ sản phẩm.
3. SIÊU NGẮN GỌN: Trả lời ngắn nhất có thể rẽ thẳng vào vấn đề. Cấm lan man. Mặc định dùng tiếng Việt. Cấm dùng lời hoa mỹ/chào kết.
4. KHÔNG DÙNG HASHTAG: Tuyệt đối không có dấu # ở bất kỳ đâu.
5. THẺ SẢN PHẨM: Khi cần gợi ý, gửi kèm HTML thẻ: 
   {{PRODUCT_CARD|Tên|Giá|productId|Link_Ảnh}}
   (Mã productId lấy từ giá trị ID trong dữ liệu. Tối đa 3 thẻ).

[CƠ SỞ DỮ LIỆU]:
${dbContext}`;

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
                    timeout: 8000 // Giảm timeout từ 20s xuống 8s để nếu mô hình đầu bị lỗi/lag thì nhanh chóng chuyển qua mô hình dự phòng
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
