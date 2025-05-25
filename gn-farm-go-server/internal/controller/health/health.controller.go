package health

import (
	"context"
	"net/http"
	"time"

	"gn-farm-go-server/global"
	"gn-farm-go-server/pkg/response"

	"github.com/gin-gonic/gin"
)

var Health = new(healthController)

type healthController struct{}

// HealthStatus represents the health status of the service
type HealthStatus struct {
	Status    string                 `json:"status"`
	Timestamp time.Time              `json:"timestamp"`
	Version   string                 `json:"version"`
	Services  map[string]ServiceInfo `json:"services"`
	Uptime    string                 `json:"uptime"`
}

// ServiceInfo represents the status of individual services
type ServiceInfo struct {
	Status      string        `json:"status"`
	ResponseTime string       `json:"response_time"`
	Error       string        `json:"error,omitempty"`
	Details     interface{}   `json:"details,omitempty"`
}

var startTime = time.Now()

// HealthCheck performs a basic health check
// @Summary      Health check endpoint
// @Description  Returns the health status of the service
// @Tags         health
// @Accept       json
// @Produce      json
// @Success      200  {object}  HealthStatus
// @Failure      503  {object}  HealthStatus
// @Router       /health [get]
func (h *healthController) HealthCheck(ctx *gin.Context) {
	healthStatus := HealthStatus{
		Status:    "healthy",
		Timestamp: time.Now(),
		Version:   "1.0.0",
		Services:  make(map[string]ServiceInfo),
		Uptime:    time.Since(startTime).String(),
	}

	// Check database connection
	dbStatus := h.checkDatabase()
	healthStatus.Services["database"] = dbStatus

	// Check Redis connection
	redisStatus := h.checkRedis()
	healthStatus.Services["redis"] = redisStatus

	// Determine overall status
	overallStatus := "healthy"
	statusCode := http.StatusOK

	for _, service := range healthStatus.Services {
		if service.Status != "healthy" {
			overallStatus = "unhealthy"
			statusCode = http.StatusServiceUnavailable
			break
		}
	}

	healthStatus.Status = overallStatus

	ctx.JSON(statusCode, healthStatus)
}

// ReadinessCheck checks if the service is ready to serve requests
// @Summary      Readiness check endpoint
// @Description  Returns whether the service is ready to serve requests
// @Tags         health
// @Accept       json
// @Produce      json
// @Success      200  {object}  response.ResponseData
// @Failure      503  {object}  response.ErrorResponseData
// @Router       /ready [get]
func (h *healthController) ReadinessCheck(ctx *gin.Context) {
	// Check critical dependencies
	dbStatus := h.checkDatabase()
	redisStatus := h.checkRedis()

	if dbStatus.Status == "healthy" && redisStatus.Status == "healthy" {
		response.SuccessResponse(ctx, response.ErrCodeSuccess, gin.H{
			"status": "ready",
			"timestamp": time.Now(),
		})
	} else {
		response.ErrorResponse(ctx, response.ErrCodeInternalServerError, "Service not ready")
	}
}

// LivenessCheck checks if the service is alive
// @Summary      Liveness check endpoint
// @Description  Returns whether the service is alive
// @Tags         health
// @Accept       json
// @Produce      json
// @Success      200  {object}  response.ResponseData
// @Router       /live [get]
func (h *healthController) LivenessCheck(ctx *gin.Context) {
	response.SuccessResponse(ctx, response.ErrCodeSuccess, gin.H{
		"status": "alive",
		"timestamp": time.Now(),
		"uptime": time.Since(startTime).String(),
	})
}

// checkDatabase checks the database connection
func (h *healthController) checkDatabase() ServiceInfo {
	start := time.Now()

	if global.Pgdbc == nil {
		return ServiceInfo{
			Status:       "unhealthy",
			ResponseTime: time.Since(start).String(),
			Error:        "Database connection not initialized",
		}
	}

	err := global.Pgdbc.Ping()
	responseTime := time.Since(start).String()

	if err != nil {
		return ServiceInfo{
			Status:       "unhealthy",
			ResponseTime: responseTime,
			Error:        err.Error(),
		}
	}

	// Get database stats
	stats := global.Pgdbc.Stats()

	return ServiceInfo{
		Status:       "healthy",
		ResponseTime: responseTime,
		Details: map[string]interface{}{
			"open_connections": stats.OpenConnections,
			"in_use":          stats.InUse,
			"idle":            stats.Idle,
		},
	}
}

// checkRedis checks the Redis connection
func (h *healthController) checkRedis() ServiceInfo {
	start := time.Now()

	if global.Rdb == nil {
		return ServiceInfo{
			Status:       "unhealthy",
			ResponseTime: time.Since(start).String(),
			Error:        "Redis connection not initialized",
		}
	}

	ctx := context.Background()
	pong, err := global.Rdb.Ping(ctx).Result()
	responseTime := time.Since(start).String()

	if err != nil {
		return ServiceInfo{
			Status:       "unhealthy",
			ResponseTime: responseTime,
			Error:        err.Error(),
		}
	}

	// Get Redis info
	poolStats := global.Rdb.PoolStats()

	return ServiceInfo{
		Status:       "healthy",
		ResponseTime: responseTime,
		Details: map[string]interface{}{
			"ping_response": pong,
			"pool_stats": map[string]interface{}{
				"hits":        poolStats.Hits,
				"misses":      poolStats.Misses,
				"timeouts":    poolStats.Timeouts,
				"total_conns": poolStats.TotalConns,
				"idle_conns":  poolStats.IdleConns,
			},
		},
	}
}
