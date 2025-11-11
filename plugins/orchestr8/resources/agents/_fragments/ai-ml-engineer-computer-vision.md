---
id: ai-ml-engineer-computer-vision
category: agent
tags: [computer-vision, cnn, object-detection, image-classification, segmentation, pytorch, torchvision, yolo, resnet]
capabilities:
  - CNN architecture design
  - Image classification and object detection
  - Semantic and instance segmentation
  - Transfer learning with pre-trained models
  - Data augmentation strategies
useWhen:
  - Building computer vision models for image classification, object detection (YOLO, Faster R-CNN), and semantic segmentation (U-Net, Mask R-CNN) using PyTorch and TensorFlow
  - Implementing convolutional neural networks (CNNs) with architectures like ResNet, EfficientNet, Vision Transformers (ViT), and transfer learning from ImageNet weights
  - Processing image data with augmentation (rotation, flipping, color jitter), normalization, resizing strategies, and handling class imbalance with weighted sampling
  - Training object detection models with anchor boxes, non-maximum suppression (NMS), focal loss for handling class imbalance, and bounding box regression
  - Deploying vision models for real-time inference using ONNX Runtime, TensorRT for GPU optimization, and edge deployment with TensorFlow Lite or CoreML
  - Evaluating computer vision performance using mAP (mean Average Precision), IoU (Intersection over Union), confusion matrices, and inference latency benchmarks
estimatedTokens: 680
---

# AI/ML Engineer - Computer Vision Expertise

## CNN Architectures

**Modern architectures with PyTorch:**
```python
import torch
import torch.nn as nn
from torchvision import models

# Transfer learning - recommended approach
model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)

# Freeze backbone, replace classifier
for param in model.parameters():
    param.requires_grad = False

num_features = model.fc.in_features
model.fc = nn.Sequential(
    nn.Dropout(0.5),
    nn.Linear(num_features, 512),
    nn.ReLU(),
    nn.Dropout(0.3),
    nn.Linear(512, num_classes)
)

# Custom CNN from scratch
class CustomCNN(nn.Module):
    def __init__(self, num_classes: int):
        super().__init__()
        self.features = nn.Sequential(
            # Conv block 1
            nn.Conv2d(3, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),

            # Conv block 2
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.Conv2d(128, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),

            # Conv block 3
            nn.Conv2d(128, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.Conv2d(256, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2)
        )

        self.classifier = nn.Sequential(
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten(),
            nn.Dropout(0.5),
            nn.Linear(256, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(512, num_classes)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.features(x)
        x = self.classifier(x)
        return x
```

## Data Augmentation

**Production-grade augmentation:**
```python
from torchvision import transforms
from torch.utils.data import DataLoader, Dataset
import albumentations as A
from albumentations.pytorch import ToTensorV2

# TorchVision transforms (basic)
train_transform = transforms.Compose([
    transforms.RandomResizedCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

val_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Albumentations (more powerful, faster)
train_transform_albu = A.Compose([
    A.RandomResizedCrop(height=224, width=224, scale=(0.8, 1.0)),
    A.HorizontalFlip(p=0.5),
    A.ShiftScaleRotate(shift_limit=0.1, scale_limit=0.1, rotate_limit=15, p=0.5),
    A.OneOf([
        A.GaussNoise(var_limit=(10.0, 50.0)),
        A.GaussianBlur(blur_limit=(3, 7)),
        A.MotionBlur(blur_limit=5)
    ], p=0.3),
    A.OneOf([
        A.RandomBrightnessContrast(brightness_limit=0.2, contrast_limit=0.2),
        A.HueSaturationValue(hue_shift_limit=20, sat_shift_limit=30, val_shift_limit=20)
    ], p=0.3),
    A.CoarseDropout(max_holes=8, max_height=16, max_width=16, p=0.3),
    A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ToTensorV2()
])

# Custom dataset with albumentations
class ImageDataset(Dataset):
    def __init__(self, image_paths: list[str], labels: list[int], transform=None):
        self.image_paths = image_paths
        self.labels = labels
        self.transform = transform

    def __len__(self) -> int:
        return len(self.image_paths)

    def __getitem__(self, idx: int):
        from PIL import Image
        import numpy as np

        image = Image.open(self.image_paths[idx]).convert('RGB')
        image = np.array(image)
        label = self.labels[idx]

        if self.transform:
            transformed = self.transform(image=image)
            image = transformed['image']

        return image, label
```

## Object Detection

**Using detectron2 and YOLO:**
```python
# Detectron2 - flexible, research-oriented
from detectron2 import model_zoo
from detectron2.config import get_cfg
from detectron2.engine import DefaultTrainer, DefaultPredictor
from detectron2.data import DatasetCatalog, MetadataCatalog

# Setup config
cfg = get_cfg()
cfg.merge_from_file(model_zoo.get_config_file('COCO-Detection/faster_rcnn_R_50_FPN_3x.yaml'))
cfg.MODEL.WEIGHTS = model_zoo.get_checkpoint_url('COCO-Detection/faster_rcnn_R_50_FPN_3x.yaml')
cfg.MODEL.ROI_HEADS.NUM_CLASSES = num_classes
cfg.SOLVER.IMS_PER_BATCH = 2
cfg.SOLVER.BASE_LR = 0.00025
cfg.SOLVER.MAX_ITER = 3000

# Train
trainer = DefaultTrainer(cfg)
trainer.resume_or_load(resume=False)
trainer.train()

# Inference
cfg.MODEL.WEIGHTS = './output/model_final.pth'
cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.5
predictor = DefaultPredictor(cfg)
outputs = predictor(image)

# Ultralytics YOLOv8 - production-ready, easy to use
from ultralytics import YOLO

# Load pre-trained model
model = YOLO('yolov8n.pt')  # nano, small, medium, large, xlarge

# Train on custom data
model.train(
    data='dataset.yaml',
    epochs=100,
    imgsz=640,
    batch=16,
    device='0',
    workers=8
)

# Inference
results = model('image.jpg')
for result in results:
    boxes = result.boxes  # Boxes object
    for box in boxes:
        cls = int(box.cls[0])
        conf = float(box.conf[0])
        xyxy = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
```

## Semantic Segmentation

**U-Net and DeepLab architectures:**
```python
import segmentation_models_pytorch as smp

# Pre-built segmentation models
model = smp.Unet(
    encoder_name='resnet34',
    encoder_weights='imagenet',
    in_channels=3,
    classes=num_classes
)

# DeepLabV3+
model = smp.DeepLabV3Plus(
    encoder_name='resnet50',
    encoder_weights='imagenet',
    in_channels=3,
    classes=num_classes
)

# Custom U-Net
class UNet(nn.Module):
    def __init__(self, in_channels: int, num_classes: int):
        super().__init__()

        # Encoder (downsampling)
        self.enc1 = self.conv_block(in_channels, 64)
        self.enc2 = self.conv_block(64, 128)
        self.enc3 = self.conv_block(128, 256)
        self.enc4 = self.conv_block(256, 512)

        self.pool = nn.MaxPool2d(2, 2)

        # Bottleneck
        self.bottleneck = self.conv_block(512, 1024)

        # Decoder (upsampling)
        self.upconv4 = nn.ConvTranspose2d(1024, 512, 2, stride=2)
        self.dec4 = self.conv_block(1024, 512)

        self.upconv3 = nn.ConvTranspose2d(512, 256, 2, stride=2)
        self.dec3 = self.conv_block(512, 256)

        self.upconv2 = nn.ConvTranspose2d(256, 128, 2, stride=2)
        self.dec2 = self.conv_block(256, 128)

        self.upconv1 = nn.ConvTranspose2d(128, 64, 2, stride=2)
        self.dec1 = self.conv_block(128, 64)

        self.out = nn.Conv2d(64, num_classes, 1)

    def conv_block(self, in_channels: int, out_channels: int):
        return nn.Sequential(
            nn.Conv2d(in_channels, out_channels, 3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, 3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Encoder
        enc1 = self.enc1(x)
        enc2 = self.enc2(self.pool(enc1))
        enc3 = self.enc3(self.pool(enc2))
        enc4 = self.enc4(self.pool(enc3))

        # Bottleneck
        bottleneck = self.bottleneck(self.pool(enc4))

        # Decoder with skip connections
        dec4 = self.upconv4(bottleneck)
        dec4 = torch.cat([dec4, enc4], dim=1)
        dec4 = self.dec4(dec4)

        dec3 = self.upconv3(dec4)
        dec3 = torch.cat([dec3, enc3], dim=1)
        dec3 = self.dec3(dec3)

        dec2 = self.upconv2(dec3)
        dec2 = torch.cat([dec2, enc2], dim=1)
        dec2 = self.dec2(dec2)

        dec1 = self.upconv1(dec2)
        dec1 = torch.cat([dec1, enc1], dim=1)
        dec1 = self.dec1(dec1)

        return self.out(dec1)

# Segmentation loss functions
class DiceLoss(nn.Module):
    def __init__(self, smooth: float = 1.0):
        super().__init__()
        self.smooth = smooth

    def forward(self, pred: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
        pred = torch.softmax(pred, dim=1)
        pred_flat = pred.contiguous().view(-1)
        target_flat = target.contiguous().view(-1)

        intersection = (pred_flat * target_flat).sum()
        dice = (2. * intersection + self.smooth) / (pred_flat.sum() + target_flat.sum() + self.smooth)

        return 1 - dice

# Combined loss
class CombinedLoss(nn.Module):
    def __init__(self, alpha: float = 0.5):
        super().__init__()
        self.alpha = alpha
        self.ce = nn.CrossEntropyLoss()
        self.dice = DiceLoss()

    def forward(self, pred: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
        return self.alpha * self.ce(pred, target) + (1 - self.alpha) * self.dice(pred, target)
```

## Training Techniques

**Advanced training patterns:**
```python
from torch.cuda.amp import autocast, GradScaler

# Mixed precision training
scaler = GradScaler()
model = model.to(device)

for epoch in range(num_epochs):
    for batch in train_loader:
        images, labels = batch[0].to(device), batch[1].to(device)

        optimizer.zero_grad()

        # Forward pass with autocasting
        with autocast():
            outputs = model(images)
            loss = criterion(outputs, labels)

        # Backward pass with gradient scaling
        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()

# Gradual unfreezing (transfer learning)
def unfreeze_layers(model, num_layers: int):
    """Progressively unfreeze layers from end to start."""
    params = list(model.parameters())
    for param in params[-num_layers:]:
        param.requires_grad = True

# Training schedule
epochs_per_stage = 5
for stage in range(3):
    unfreeze_layers(model, num_layers=10 * (stage + 1))
    train(model, train_loader, epochs=epochs_per_stage)
```

## Inference Optimization

**Efficient deployment:**
```python
# TorchScript export
model.eval()
example_input = torch.randn(1, 3, 224, 224)
traced_model = torch.jit.trace(model, example_input)
traced_model.save('model_traced.pt')

# ONNX export for cross-platform deployment
torch.onnx.export(
    model,
    example_input,
    'model.onnx',
    export_params=True,
    opset_version=14,
    do_constant_folding=True,
    input_names=['input'],
    output_names=['output'],
    dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
)

# Batch inference for efficiency
def batch_predict(model, images: list, batch_size: int = 32):
    model.eval()
    predictions = []

    with torch.no_grad():
        for i in range(0, len(images), batch_size):
            batch = images[i:i+batch_size]
            batch_tensor = torch.stack([transform(img) for img in batch])
            batch_tensor = batch_tensor.to(device)

            outputs = model(batch_tensor)
            preds = torch.softmax(outputs, dim=1).cpu().numpy()
            predictions.extend(preds)

    return predictions
```

## Best Practices

- **Use pre-trained models** - ImageNet weights provide excellent features
- **Progressive resizing** - Start with smaller images, increase size later
- **Data augmentation is critical** - Vision models need it to generalize
- **BatchNorm over Dropout** - BatchNorm usually sufficient in CNNs
- **Mixed precision training** - 2-3x speedup on modern GPUs
- **Monitor overfitting** - Track train/val metrics, use early stopping
- **Test-time augmentation** - Average predictions over augmented versions
- **Class balancing** - Use weighted loss or oversampling for imbalanced datasets

## Anti-Patterns

- Training from scratch when transfer learning is viable
- Not normalizing images with ImageNet statistics when using pre-trained models
- Using too aggressive augmentation (destroying semantic content)
- Forgetting to set `model.eval()` and `torch.no_grad()` during inference
- Not using DataLoader with `num_workers` and `pin_memory`
- Ignoring aspect ratio (stretching images instead of padding/cropping)
- Using small batch sizes without adjusting learning rate
