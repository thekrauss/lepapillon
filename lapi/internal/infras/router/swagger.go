package router

import (
	"encoding/json"
	"net/http"
	"reflect"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/thekrauss/lepapillon/internal/infras/middleware"
	"github.com/wI2L/fizz"
	"github.com/wI2L/fizz/openapi"
)

// ── Route & RouteGroup — same pattern as gophercart ─────────────────

const PathAPIRoot = "/api/v1"

var RootGroup = NewRootGroup(PathAPIRoot, "API principale LePapillon — Saveurs Thaï")

type Route struct {
	Path           string
	Method         string
	Description    string
	Summary        string
	Handler        gin.HandlerFunc
	Middlewares     []gin.HandlerFunc
	ID             string
	Right          string
	Public         bool
	Payload        interface{}
	Query          interface{}
	Responses      map[int]interface{}
	UseIdempotency bool
}

type RouteGroup struct {
	Path        string
	Tag         string
	Description string
	Routes      []*Route
	Groups      []*RouteGroup
	Middlewares  []gin.HandlerFunc
}

var (
	AllGroups []*RouteGroup
	RouteMap  = make(map[string]*Route)
)

func NewRootGroup(path string, desc string) *RouteGroup {
	g := &RouteGroup{Path: path, Description: desc}
	AllGroups = append(AllGroups, g)
	return g
}

func (g *RouteGroup) NewGroup(path string, desc string) *RouteGroup {
	child := &RouteGroup{Path: path, Description: desc}
	g.Groups = append(g.Groups, child)
	return child
}

func (g *RouteGroup) AddRoute(path string, method string, desc string, handler gin.HandlerFunc) *Route {
	r := &Route{
		Method:      method,
		Path:        path,
		Description: desc,
		Handler:     handler,
		Responses:   make(map[int]interface{}),
	}
	g.Routes = append(g.Routes, r)
	return r
}

func (r *Route) AddMiddleware(middlewares ...gin.HandlerFunc) *Route {
	r.Middlewares = append(r.Middlewares, middlewares...)
	return r
}

func (r *Route) AddIdempotency() *Route {
	r.UseIdempotency = true
	return r
}

func (r *Route) AddID(id string) *Route {
	r.ID = id
	return r
}

func (r *Route) AddPayload(dto interface{}) *Route {
	r.Payload = dto
	return r
}

func (r *Route) AddQuery(dto interface{}) *Route {
	r.Query = dto
	return r
}

func (r *Route) AddResponse(status int, description string, dto interface{}) *Route {
	r.Responses[status] = dto
	return r
}

func (r *Route) AddSummary(summary string) *Route {
	r.Summary = summary
	return r
}

func (r *Route) MarkPublic() *Route {
	r.Public = true
	return r
}

func (g *RouteGroup) SetTag(tag string) *RouteGroup {
	g.Tag = strings.TrimSpace(tag)
	return g
}

// ── Schema & Swagger UI ─────────────────────────────────────────────

func RegisterSchema(router *fizz.Fizz, title, desc string, l *logrus.Entry) error {
	info := &openapi.Info{
		Title:       title,
		Description: desc,
		Version:     "1.0.0",
	}

	finalSecuritySchemes := map[string]*openapi.SecuritySchemeOrRef{
		"BearerAuth": {
			SecurityScheme: &openapi.SecurityScheme{
				Type:         "http",
				Scheme:       "bearer",
				BearerFormat: "JWT",
				Description:  "JWT Bearer Token (Ex: 'Bearer eyJhbGci...')",
			},
		},
	}
	router.Generator().SetSecuritySchemes(finalSecuritySchemes)
	_ = router.Generator().OverrideDataType(reflect.TypeOf(map[string]any{}), "object", "")

	openAPIPath := PathAPIRoot + "/openapi.json"
	openAPIHandler := router.OpenAPI(info, "json")
	router.GET(openAPIPath, nil, openAPIHandler)
	router.GET("/openapi.json", nil, openAPIHandler)

	// Scalar UI (public doc)
	scalarHTML := `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Saveurs Thaï API Docs</title>
</head>
<body>
  <script id="api-reference" data-url="` + openAPIPath + `"></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`
	router.GET("/docs", nil, func(c *gin.Context) {
		c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(scalarHTML))
	})

	l.Infof("OpenAPI JSON: %s", openAPIPath)
	l.Infof("Scalar UI:    /docs")
	return nil
}

// ── Route registration (fizz) ───────────────────────────────────────

func RegisterRoutes(app *fizz.Fizz, mw *middleware.Manager) error {
	for _, g := range AllGroups {
		registerGroup(app.Group(g.Path, "", g.Description), g, g.Path, mw)
	}
	return nil
}

func registerGroup(fg *fizz.RouterGroup, group *RouteGroup, absPath string, mw *middleware.Manager) {
	g := fg

	if mw != nil {
		g.Use(mw.AuthMiddleware())
		g.Use(mw.UserSyncGinMiddleware())
	}

	for _, m := range group.Middlewares {
		g.Use(m)
	}

	for _, r := range group.Routes {
		opID := r.ID
		if opID == "" {
			opID = buildOperationID(r.Method, absPath, r.Path)
		}

		options := []fizz.OperationOption{
			fizz.Description(r.Description),
			fizz.ID(opID),
		}

		if r.Payload != nil {
			options = append(options, fizz.InputModel(r.Payload))
		} else if r.Query != nil {
			options = append(options, fizz.InputModel(r.Query))
		}

		for status, dto := range r.Responses {
			if status >= 200 && status < 300 {
				continue
			}
			options = append(options, fizz.Response(
				strconv.Itoa(status),
				http.StatusText(status),
				dto,
				nil,
				nil,
			))
		}

		handlers := make([]gin.HandlerFunc, 0, len(r.Middlewares)+2)
		if r.UseIdempotency {
			handlers = append(handlers, middleware.Idempotency())
		}
		handlers = append(handlers, r.Middlewares...)
		handlers = append(handlers, r.Handler)

		g.Handle(r.Path, r.Method, options, handlers...)
	}

	for _, child := range group.Groups {
		registerGroup(g.Group(child.Path, "", child.Description), child, absPath+child.Path, mw)
	}
}

func buildOperationID(method, absPath, relPath string) string {
	fullPath := strings.TrimSuffix(absPath, "/")
	if relPath != "" {
		if !strings.HasPrefix(relPath, "/") {
			fullPath += "/"
		}
		fullPath += relPath
	}
	fullPath = strings.Trim(fullPath, "/")
	if fullPath == "" {
		fullPath = "root"
	}
	replacer := strings.NewReplacer("/", "_", ":", "by_", "{", "", "}", "", "-", "_", ".", "_")
	return strings.ToLower(method) + "_" + replacer.Replace(fullPath)
}

func httpToGin(mw func(http.Handler) http.Handler) gin.HandlerFunc {
	return func(c *gin.Context) {
		called := false
		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			called = true
			c.Request = r
			c.Next()
		})
		mw(next).ServeHTTP(c.Writer, c.Request)
		if !called {
			c.Abort()
		}
	}
}

func pruneUnusedOpenAPITags(body []byte) ([]byte, error) {
	var doc map[string]any
	if err := json.Unmarshal(body, &doc); err != nil {
		return nil, err
	}

	used := make(map[string]struct{})
	paths, _ := doc["paths"].(map[string]any)
	for _, rawPath := range paths {
		ops, ok := rawPath.(map[string]any)
		if !ok {
			continue
		}
		for _, rawOp := range ops {
			op, ok := rawOp.(map[string]any)
			if !ok {
				continue
			}
			rawTags, _ := op["tags"].([]any)
			for _, rawTag := range rawTags {
				if name, ok := rawTag.(string); ok && strings.TrimSpace(name) != "" {
					used[name] = struct{}{}
				}
			}
		}
	}

	if rawTags, ok := doc["tags"].([]any); ok {
		filtered := make([]any, 0, len(rawTags))
		for _, rawTag := range rawTags {
			tag, ok := rawTag.(map[string]any)
			if !ok {
				continue
			}
			name, _ := tag["name"].(string)
			if _, keep := used[name]; keep {
				filtered = append(filtered, tag)
			}
		}
		doc["tags"] = filtered
	}

	return json.Marshal(doc)
}
