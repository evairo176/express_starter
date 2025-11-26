"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    success(res, data, message = 'Success', status = 200, metadata = {}) {
        return res.status(status).json({
            status: 'success',
            message,
            data,
            metadata,
        });
    },
    error(res, message = 'Error', status = 500, data = null) {
        return res.status(status).json(Object.assign({ status: 'error', message, code: status }, (data ? { data } : {})));
    },
};
