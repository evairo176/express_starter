"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testimonialController = exports.testimonialService = void 0;
const testimonial_controller_1 = require("./testimonial.controller");
const testimonial_service_1 = require("./testimonial.service");
const testimonialService = new testimonial_service_1.TestimonialService();
exports.testimonialService = testimonialService;
const testimonialController = new testimonial_controller_1.TestimonialController(testimonialService);
exports.testimonialController = testimonialController;
