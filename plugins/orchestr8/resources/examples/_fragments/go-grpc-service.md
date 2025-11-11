---
id: go-grpc-service
category: example
tags: [go, golang, grpc, protobuf, microservice]
capabilities:
  - gRPC service implementation
  - Protocol Buffers
  - Middleware interceptors
useWhen:
  - Go microservices requiring high-performance RPC with Protocol Buffers for efficient binary serialization over HTTP/2
  - Building service-to-service communication with strong typing from .proto definitions and compile-time interface verification
  - Distributed systems needing gRPC unary interceptors for cross-cutting concerns like logging, metrics, and request tracing
  - Go services requiring structured error handling with gRPC status codes (InvalidArgument, NotFound, Internal) and error details
  - Microservice architectures where gRPC provides automatic code generation for clients and servers across multiple languages
  - Building APIs requiring bidirectional streaming, server push, or client streaming capabilities beyond REST limitations
estimatedTokens: 450
---

# Go gRPC Service

```go
// Proto definition (user.proto)
service UserService {
  rpc GetUser(GetUserRequest) returns (GetUserResponse);
  rpc CreateUser(CreateUserRequest) returns (CreateUserResponse);
}

message GetUserRequest { string id = 1; }
message GetUserResponse { User user = 1; }
message User {
  string id = 1;
  string email = 2;
  string name = 3;
}

// Service implementation
type UserService struct {
    pb.UnimplementedUserServiceServer
    repo *UserRepository
}

func (s *UserService) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.GetUserResponse, error) {
    id, err := uuid.Parse(req.Id)
    if err != nil {
        return nil, status.Error(codes.InvalidArgument, "invalid user ID")
    }
    
    user, err := s.repo.GetByID(ctx, id)
    if err != nil {
        return nil, status.Errorf(codes.NotFound, "user not found: %v", err)
    }
    
    return &pb.GetUserResponse{User: modelToProto(user)}, nil
}

// Logging interceptor
func LoggingInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
    start := time.Now()
    log.Printf("gRPC request - Method:%s", info.FullMethod)
    
    resp, err := handler(ctx, req)
    
    log.Printf("gRPC response - Method:%s Duration:%v Code:%s", 
        info.FullMethod, time.Since(start), status.Code(err))
    
    return resp, err
}

// Server setup
func main() {
    grpcServer := grpc.NewServer(
        grpc.ChainUnaryInterceptor(LoggingInterceptor),
    )
    
    pb.RegisterUserServiceServer(grpcServer, &UserService{repo: repo})
    
    lis, _ := net.Listen("tcp", ":50051")
    grpcServer.Serve(lis)
}
```
