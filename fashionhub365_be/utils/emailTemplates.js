const config = require('../config/config');

const BRAND_NAME = 'FashionHub365';
const BRAND_COLOR = '#111111';
const SECONDARY_COLOR = '#444444';
const BG_COLOR = '#f5f5f5';
const SUCCESS_COLOR = '#15803d';
const SUCCESS_BG = '#f0fdf4';
const DANGER_COLOR = '#b91c1c';
const DANGER_BG = '#fef2f2';

const frontendUrl = config.frontendUrl || 'http://localhost:3000';

const formatCurrency = (value = 0) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));

const getBaseTemplate = (title, preheader, content) => {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: ${BG_COLOR};
            color: #333333;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper {
            width: 100%;
            table-layout: fixed;
            background-color: ${BG_COLOR};
            padding-bottom: 60px;
        }
        .main {
            background-color: #ffffff;
            margin: 40px auto 0;
            width: 100%;
            max-width: 600px;
            border-spacing: 0;
            color: #333333;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .header {
            background-color: ${BRAND_COLOR};
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .body-content {
            padding: 40px 30px;
            font-size: 16px;
            line-height: 1.6;
        }
        .footer {
            background-color: #ffffff;
            padding: 20px 30px 30px;
            text-align: center;
            border-top: 1px solid #eeeeee;
        }
        .footer p {
            margin: 0;
            font-size: 13px;
            color: #888888;
            line-height: 1.5;
        }
        .btn {
            display: inline-block;
            background-color: ${BRAND_COLOR};
            color: #ffffff;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 4px;
            font-weight: bold;
            margin-top: 24px;
            margin-bottom: 24px;
            text-align: center;
        }
        .btn:hover {
            background-color: ${SECONDARY_COLOR};
        }
        .card {
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .preheader {
            display: none;
            max-height: 0;
            overflow: hidden;
        }
    </style>
</head>
<body>
    <span class="preheader">${preheader}</span>
    <table class="wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
            <td align="center">
                <table class="main" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                        <td class="header">
                            <h1>${BRAND_NAME}</h1>
                        </td>
                    </tr>
                    <tr>
                        <td class="body-content">
                            ${content}
                        </td>
                    </tr>
                    <tr>
                        <td class="footer">
                            <p>&copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
                            <p>Nếu bạn không có ý định thực hiện hành động này, vui lòng bỏ qua email này.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};

const getVerificationEmailTemplate = (url) => {
    const title = 'Xác thực địa chỉ email của bạn';
    const preheader = 'Chào mừng đến với FashionHub365, vui lòng xác nhận email để tiếp tục.';
    const content = `
        <h2 style="margin-top:0; color:${BRAND_COLOR};">Xin chào!</h2>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>${BRAND_NAME}</strong>.</p>
        <p>Để hoàn tất việc tạo tài khoản và bảo mật thông tin, vui lòng xác thực địa chỉ email của bạn bằng cách nhấp vào nút bên dưới:</p>
        <div style="text-align:center;">
            <a href="${url}" class="btn" style="color:#ffffff;">Xác thực Email</a>
        </div>
        <p>Hoặc bạn có thể copy và dán đường dẫn sau vào trình duyệt:</p>
        <p style="word-break: break-all; color:#666; font-size:14px;"><a href="${url}" style="color:${BRAND_COLOR};">${url}</a></p>
        <p>Liên kết này sẽ có hiệu lực trong vòng 24 giờ. Nếu bạn không tạo tài khoản tại ${BRAND_NAME}, vui lòng bỏ qua email này một cách an toàn.</p>
        <p>Trân trọng,<br><strong>Đội ngũ ${BRAND_NAME}</strong></p>
    `;
    return getBaseTemplate(title, preheader, content);
};

const getResetPasswordEmailTemplate = (url) => {
    const title = 'Yêu cầu đặt lại mật khẩu';
    const preheader = 'Chúng tôi nhận được yêu cầu đặt lại mật khẩu của bạn tại FashionHub365.';
    const content = `
        <h2 style="margin-top:0; color:${BRAND_COLOR};">Xin chào!</h2>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email này tại <strong>${BRAND_NAME}</strong>.</p>
        <p>Để đặt lại mật khẩu mới, vui lòng nhấp vào nút dưới đây:</p>
        <div style="text-align:center;">
            <a href="${url}" class="btn" style="color:#ffffff;">Đặt lại mật khẩu</a>
        </div>
        <p>Liên kết này sẽ chỉ có hiệu lực trong một khoảng thời gian ngắn vì lý do bảo mật.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, xin hãy bỏ qua email này. Mật khẩu của bạn vẫn an toàn và sẽ không bị thay đổi.</p>
        <p>Trân trọng,<br><strong>Đội ngũ ${BRAND_NAME}</strong></p>
    `;
    return getBaseTemplate(title, preheader, content);
};

const getWelcomeEmailTemplate = () => {
    const title = 'Lắng nghe nhịp điệu thời trang cùng FashionHub365';
    const preheader = 'Email của bạn đã được xác thực thành công. Bắt đầu mua sắm ngay hôm nay!';
    const content = `
        <h2 style="margin-top:0; color:${BRAND_COLOR};">Chào mừng bạn!</h2>
        <p>Xin chúc mừng, tài khoản của bạn tại <strong>${BRAND_NAME}</strong> đã được kích hoạt thành công.</p>
        <p>Chúng tôi rất vui mừng được chào đón bạn đến với cộng đồng tín đồ thời trang của chúng tôi. Tại đây, bạn sẽ khám phá các bộ sưu tập mới nhất, những xu hướng hot nhất và vô vàn ưu đãi hấp dẫn.</p>
        <div style="text-align:center;">
            <a href="${frontendUrl}" class="btn" style="color:#ffffff;">Bắt đầu mua sắm</a>
        </div>
        <p>Nếu bạn có bất kỳ thắc mắc hay cần hỗ trợ gì, đừng ngần ngại liên hệ với chúng tôi.</p>
        <p>Trân trọng,<br><strong>Đội ngũ ${BRAND_NAME}</strong></p>
    `;
    return getBaseTemplate(title, preheader, content);
};

const getPasswordChangedEmailTemplate = () => {
    const title = 'Mật khẩu của bạn đã được thay đổi';
    const preheader = 'Thông báo quan trọng về bảo mật tài khoản của bạn tại FashionHub365.';
    const content = `
        <h2 style="margin-top:0; color:${BRAND_COLOR};">Xin chào,</h2>
        <p>Đây là email xác nhận rằng mật khẩu cho tài khoản của bạn tại <strong>${BRAND_NAME}</strong> vừa được thay đổi thành công.</p>
        <p>Nếu bạn là người thực hiện thay đổi này, bạn không cần làm gì thêm.</p>
        <div class="card" style="background-color:#fff3cd; color:#856404;">
            <strong>Lưu ý:</strong> Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ bộ phận hỗ trợ ngay lập tức để bảo vệ tài khoản.
        </div>
        <p>Trân trọng,<br><strong>Đội ngũ ${BRAND_NAME}</strong></p>
    `;
    return getBaseTemplate(title, preheader, content);
};

const getOrderCreatedEmailTemplate = (order) => {
    const shortCode = order.uuid.substring(0, 8);
    const title = `Đặt hàng thành công #${shortCode}`;
    const preheader = `Đơn hàng #${shortCode} của bạn đã được tiếp nhận thành công tại ${BRAND_NAME}.`;

    const itemsHtml = (order.items || []).map((item) => `
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee;">
                    <p style="margin: 0; font-weight: bold;">${item.product_name}</p>
                    <p style="margin: 4px 0 0; font-size: 14px; color: #666666;">Số lượng: ${item.quantity}</p>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; text-align: right; vertical-align: top;">
                    ${formatCurrency(item.price * item.quantity)}
                </td>
            </tr>
        `).join('');

    const shipping = order.shipping_address || {};
    const subtotal = Number(order.total_amount || 0) - Number(order.shipping_fee || 0);

    const content = `
        <div class="card" style="background-color:${SUCCESS_BG}; border:1px solid #bbf7d0;">
            <p style="margin:0; font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:${SUCCESS_COLOR}; font-weight:bold;">Order Success</p>
            <h2 style="margin:10px 0 0; color:${SUCCESS_COLOR};">Đặt hàng thành công</h2>
            <p style="margin:10px 0 0;">Đơn hàng <strong>#${shortCode}</strong> của bạn đã được hệ thống ghi nhận và đang chờ xử lý.</p>
        </div>

        <p>Chào bạn, cảm ơn bạn đã mua sắm tại <strong>${BRAND_NAME}</strong>. Dưới đây là thông tin đơn hàng của bạn:</p>

        <div class="card" style="background-color:#f9f9f9;">
            <h3 style="margin-top:0; font-size:18px; border-bottom:2px solid ${BRAND_COLOR}; padding-bottom:10px;">Chi tiết đơn hàng</h3>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                ${itemsHtml}
                <tr>
                    <td style="padding: 18px 0 6px; font-weight: bold;">Tổng tiền hàng:</td>
                    <td style="padding: 18px 0 6px; text-align: right;">${formatCurrency(subtotal)}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; font-weight: bold;">Phí vận chuyển:</td>
                    <td style="padding: 6px 0; text-align: right;">${formatCurrency(order.shipping_fee || 0)}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 0 0; font-size: 18px; font-weight: bold; color: ${BRAND_COLOR};">Tổng cộng:</td>
                    <td style="padding: 12px 0 0; font-size: 18px; font-weight: bold; color: ${BRAND_COLOR}; text-align: right;">${formatCurrency(order.total_amount)}</td>
                </tr>
            </table>
        </div>

        <div class="card" style="background-color:#fafafa; border:1px solid #ededed;">
            <h3 style="margin-top:0; font-size:16px;">Địa chỉ giao hàng</h3>
            <p style="margin:0; color:#666666; line-height:1.5;">
                ${shipping.receiver_name || ''}<br>
                ${shipping.phone_number || ''}<br>
                ${shipping.address_line || ''}, ${shipping.ward || ''}, ${shipping.district || ''}, ${shipping.city || ''}
            </p>
        </div>

        <div style="text-align:center; margin-top: 30px;">
            <a href="${frontendUrl}/profile" class="btn" style="color:#ffffff;">Theo dõi đơn hàng</a>
        </div>

        <p>Trân trọng,<br><strong>Đội ngũ ${BRAND_NAME}</strong></p>
    `;
    return getBaseTemplate(title, preheader, content);
};

const getOrderCancelledEmailTemplate = (order, reason = 'Yêu cầu từ khách hàng hoặc thanh toán thất bại') => {
    const shortCode = order.uuid.substring(0, 8);
    const title = `Đơn hàng #${shortCode} đã bị hủy`;
    const preheader = `Thông báo về việc hủy đơn hàng #${shortCode} tại ${BRAND_NAME}.`;

    const content = `
        <div class="card" style="background-color:${DANGER_BG}; border:1px solid #fecaca;">
            <p style="margin:0; font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:${DANGER_COLOR}; font-weight:bold;">Order Cancelled</p>
            <h2 style="margin:10px 0 0; color:${DANGER_COLOR};">Đơn hàng đã bị hủy</h2>
            <p style="margin:10px 0 0;">Đơn hàng <strong>#${shortCode}</strong> của bạn hiện không còn được xử lý.</p>
        </div>

        <p>Chào bạn, chúng tôi rất tiếc phải thông báo rằng đơn hàng <strong>#${shortCode}</strong> của bạn đã bị hủy.</p>

        <div class="card" style="background-color:#fff5f5; border-left:4px solid ${DANGER_COLOR};">
            <p style="margin:0; font-weight:bold; color:${DANGER_COLOR};">Lý do hủy</p>
            <p style="margin:8px 0 0;">${reason}</p>
        </div>

        <div class="card" style="background-color:#fafafa; border:1px solid #ededed;">
            <p style="margin:0;"><strong>Mã đơn hàng:</strong> #${shortCode}</p>
            <p style="margin:8px 0 0;"><strong>Tổng thanh toán:</strong> ${formatCurrency(order.total_amount)}</p>
        </div>

        <p>Nếu bạn đã thanh toán trực tuyến cho đơn hàng này, số tiền sẽ được hoàn trả vào tài khoản của bạn trong vòng 3-5 ngày làm việc tùy theo chính sách ngân hàng.</p>
        <p>Chúng tôi hy vọng sẽ sớm được phục vụ bạn trong những lần mua sắm tiếp theo.</p>

        <div style="text-align:center; margin-top: 30px;">
            <a href="${frontendUrl}" class="btn" style="color:#ffffff;">Tiếp tục mua sắm</a>
        </div>

        <p>Trân trọng,<br><strong>Đội ngũ ${BRAND_NAME}</strong></p>
    `;
    return getBaseTemplate(title, preheader, content);
};

module.exports = {
    getVerificationEmailTemplate,
    getResetPasswordEmailTemplate,
    getWelcomeEmailTemplate,
    getPasswordChangedEmailTemplate,
    getOrderCreatedEmailTemplate,
    getOrderCancelledEmailTemplate,
};
