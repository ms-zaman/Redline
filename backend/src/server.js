import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
    cors({
        origin:
            process.env.NODE_ENV === "production"
                ? process.env.FRONTEND_URL
                : ["http://localhost:3000", "http://localhost:3001"],
        credentials: true,
    })
);

// Rate limiting
const limiter = rateLimit({
    windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
    message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
if (process.env.NODE_ENV !== "test") {
    app.use(morgan("combined"));
}

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
    });
});

// API routes
app.get("/api", (req, res) => {
    res.json({
        message: "Bangladesh Political Violence Tracker API",
        version: "1.0.0",
        endpoints: {
            incidents: "/api/incidents",
            articles: "/api/articles",
            sources: "/api/sources",
            locations: "/api/locations",
            statistics: "/api/statistics",
        },
    });
});

// Import route handlers (will be created later)
// app.use('/api/incidents', incidentRoutes);
// app.use('/api/articles', articleRoutes);
// app.use('/api/sources', sourceRoutes);
// app.use('/api/locations', locationRoutes);
// app.use('/api/statistics', statisticsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);

    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ error: "Invalid JSON payload" });
    }

    res.status(err.status || 500).json({
        error:
            process.env.NODE_ENV === "production"
                ? "Internal server error"
                : err.message,
    });
});

// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Start server
if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
        console.log(`🔗 API: http://localhost:${PORT}/api`);
    });
}

export default app;
