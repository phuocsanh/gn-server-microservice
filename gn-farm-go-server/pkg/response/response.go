package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// // Constants for error codes were moved to httpStatusCode.go
// const (
// 	ErrCodeSuccess             = 200
// 	ErrCodeParamInvalid       = 400
// 	ErrCodeUnauthorized       = 401
// 	ErrCodeForbidden          = 403
// 	ErrCodeNotFound           = 404
// 	ErrCodeInternalServerError = 500
// )

// // Map for error messages was moved to httpStatusCode.go
// var msg = map[int]string{
// 	ErrCodeSuccess:             "Success",
// 	ErrCodeParamInvalid:       "Invalid parameters",
// 	ErrCodeUnauthorized:       "Unauthorized",
// 	ErrCodeForbidden:          "Forbidden",
// 	ErrCodeNotFound:           "Not found",
// 	ErrCodeInternalServerError: "Internal server error",
// }

type ResponseData struct {
	Code    int         `json:"code"`    // status code
	Message string      `json:"message"` // thong bao loi
	Data    interface{} `json:"data"`    // du lai return
}

type ErrorResponseData struct {
	Code   int         `json:"code"`   // status code
	Err    string      `json:"error"`  // thong bao loi
	Detail interface{} `json:"detail"` // du lai return
}

// success response
func SuccessResponse(c *gin.Context, code int, data interface{}) {
	c.JSON(http.StatusOK, ResponseData{
		Code:    code,
		Message: msg[code], // Uses 'msg' map from httpStatusCode.go
		Data:    data,
	})
}

func ErrorResponse(c *gin.Context, code int, message string) {
	if message == "" {
		message = msg[code]
	}
	// map our code to HTTP status
	httpStatus := http.StatusOK
	switch code {
	case ErrCodeParamInvalid:
		httpStatus = http.StatusBadRequest
	case ErrCodeUnauthorized:
		httpStatus = http.StatusUnauthorized
	case ErrCodeForbidden:
		httpStatus = http.StatusForbidden
	case ErrCodeNotFound:
		httpStatus = http.StatusNotFound
	case ErrCodeInternalServerError:
		httpStatus = http.StatusInternalServerError
	default:
		if code >= 100 && code < 600 {
			httpStatus = code
		} else {
			httpStatus = http.StatusBadRequest
		}
	}
	c.JSON(httpStatus, ResponseData{
		Code:    code,
		Message: message,
		Data:    nil,
	})
}

// SuccessResponseWithItem trả về response với một item
func SuccessResponseWithItem(c *gin.Context, code int, item interface{}) {
	data := gin.H{
		"item": item,
	}
	SuccessResponse(c, code, data)
}

// SuccessResponseWithItems trả về response với danh sách items
func SuccessResponseWithItems(c *gin.Context, code int, items interface{}) {
	data := gin.H{
		"items": items,
	}
	SuccessResponse(c, code, data)
}

// SuccessResponseWithPagination trả về response với danh sách items và thông tin phân trang
func SuccessResponseWithPagination(c *gin.Context, code int, items interface{}, pagination interface{}) {
	data := gin.H{
		"items":      items,
		"pagination": pagination,
	}
	SuccessResponse(c, code, data)
}
