package services

import (
	"context"
	"io"
	"log"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"

	"github.com/icarrr/ambildarahku-backend/internal/config"
)

type FileService struct {
	client *minio.Client
	bucket string
}

func NewFileService(cfg *config.Config) *FileService {
	client, err := minio.New(cfg.S3Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.S3AccessKey, cfg.S3SecretKey, ""),
		Secure: cfg.S3UseSSL,
	})
	if err != nil {
		log.Fatalf("failed to create minio client: %v", err)
	}

	ctx := context.Background()
	bucket := cfg.S3Bucket

	if err := client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{}); err != nil {
		exists, errExists := client.BucketExists(ctx, bucket)
		if errExists != nil || !exists {
			log.Printf("warning: failed to create bucket: %v", err)
		}
	}

	return &FileService{client: client, bucket: bucket}
}

func (s *FileService) Upload(ctx context.Context, objectName string, reader io.Reader, size int64, contentType string) (string, error) {
	_, err := s.client.PutObject(ctx, s.bucket, objectName, reader, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", err
	}

	return s.GetPublicURL(objectName), nil
}

func (s *FileService) GetPublicURL(objectName string) string {
	return "TODO: generate presigned URL or use public bucket URL"
}
