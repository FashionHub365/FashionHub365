const apiLogger = (req, res, next) => {
    const start = Date.now();
    const { method, originalUrl, body, query, ip } = req;
    const safeQuery = query || {};
    const safeBodyInput = body || {};

    console.log(`\n======================================================`);
    console.log(`[--> REQUEST] ${method} ${originalUrl} | IP: ${ip}`);

    if (Object.keys(safeQuery).length > 0) {
        console.log(`[QUERY]:`, safeQuery);
    }

    if (Object.keys(safeBodyInput).length > 0) {
        const safeBody = { ...safeBodyInput };
        if (safeBody.password) safeBody.password = '***';
        if (safeBody.newPassword) safeBody.newPassword = '***';
        if (safeBody.oldPassword) safeBody.oldPassword = '***';
        console.log(`[BODY]:`, safeBody);
    }

    const originalSend = res.send;
    let responseBody = null;

    res.send = function (data) {
        responseBody = data;
        return originalSend.apply(res, arguments);
    };


    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;

        if (status >= 400) {
            console.error(`[<-- ERROR RESPONSE] ${method} ${originalUrl} | Status: ${status} | Duration: ${duration}ms`);
            try {
                const parsed = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
                console.error(`[ERROR DETAILS]:`, parsed);
            } catch (e) {
                console.error(`[ERROR DETAILS]:`, responseBody);
            }
        } else {
            console.log(`[<-- SUCCESS RESPONSE] ${method} ${originalUrl} | Status: ${status} | Duration: ${duration}ms`);
        }
        console.log(`======================================================\n`);
    });

    next();
};

module.exports = apiLogger;
