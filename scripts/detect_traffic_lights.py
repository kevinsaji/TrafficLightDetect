#!/usr/bin/env python3
import sys
import json
import base64
import cv2
import numpy as np
from io import BytesIO
from ultralytics import YOLO

# Load the YOLO model
model = YOLO("scripts/best.pt")

def hsv_improved_classification(image):
    predicted_label = None

    image_eq = image.copy()
    lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    limg = cv2.merge((cl, a, b))
    image_eq = cv2.cvtColor(limg, cv2.COLOR_LAB2RGB)

    # Convert to HSV
    hsv = cv2.cvtColor(image_eq, cv2.COLOR_RGB2HSV)

    height, width = hsv.shape[:2]
    top_region = hsv[0:height//3, :, :]
    middle_region = hsv[height//3:2*height//3, :, :]
    bottom_region = hsv[2*height//3:, :, :]

    red_mask1 = (hsv[:, :, 0] < 10) & (hsv[:, :, 1] > 100) & (hsv[:, :, 2] > 100)
    red_mask2 = (hsv[:, :, 0] > 170) & (hsv[:, :, 1] > 100) & (hsv[:, :, 2] > 100)
    red_mask = red_mask1 | red_mask2

    yellow_mask = (hsv[:, :, 0] > 20) & (hsv[:, :, 0] < 40) & (hsv[:, :, 1] > 100) & (hsv[:, :, 2] > 100)

    green_mask = (hsv[:, :, 0] > 40) & (hsv[:, :, 0] < 80) & (hsv[:, :, 1] > 100) & (hsv[:, :, 2] > 100)

    red_top = np.sum(red_mask & (np.ones_like(red_mask) * (np.arange(height)[:, np.newaxis] < height//3)))
    red_middle = np.sum(red_mask & (np.ones_like(red_mask) * ((np.arange(height)[:, np.newaxis] >= height//3) & (np.arange(height)[:, np.newaxis] < 2*height//3))))
    red_bottom = np.sum(red_mask & (np.ones_like(red_mask) * (np.arange(height)[:, np.newaxis] >= 2*height//3)))

    yellow_top = np.sum(yellow_mask & (np.ones_like(yellow_mask) * (np.arange(height)[:, np.newaxis] < height//3)))
    yellow_middle = np.sum(yellow_mask & (np.ones_like(yellow_mask) * ((np.arange(height)[:, np.newaxis] >= height//3) & (np.arange(height)[:, np.newaxis] < 2*height//3))))
    yellow_bottom = np.sum(yellow_mask & (np.ones_like(yellow_mask) * (np.arange(height)[:, np.newaxis] >= 2*height//3)))

    green_top = np.sum(green_mask & (np.ones_like(green_mask) * (np.arange(height)[:, np.newaxis] < height//3)))
    green_middle = np.sum(green_mask & (np.ones_like(green_mask) * ((np.arange(height)[:, np.newaxis] >= height//3) & (np.arange(height)[:, np.newaxis] < 2*height//3))))
    green_bottom = np.sum(green_mask & (np.ones_like(green_mask) * (np.arange(height)[:, np.newaxis] >= 2*height//3)))

    red_score = 1.5 * red_top + 0.8 * red_middle + 0.3 * red_bottom
    yellow_score = 0.3 * yellow_top + 1.5 * yellow_middle + 0.3 * yellow_bottom
    green_score = 0.3 * green_top + 0.8 * green_middle + 1.5 * green_bottom

    # Make decision based on weighted scores
    if red_score > yellow_score and red_score > green_score and red_score > 50:
        predicted_label = 1  # Red
    elif yellow_score > red_score and yellow_score > green_score and yellow_score > 50:
        predicted_label = 2  # Yellow
    elif green_score > 50:
        predicted_label = 0  # Green
    else:
        red_pixels = np.sum(red_mask)
        yellow_pixels = np.sum(yellow_mask)
        green_pixels = np.sum(green_mask)

        if red_pixels > yellow_pixels and red_pixels > green_pixels and red_pixels > 20:
            predicted_label = 1  # Red
        elif yellow_pixels > red_pixels and yellow_pixels > green_pixels and yellow_pixels > 20:
            predicted_label = 2  # Yellow
        elif green_pixels > 20:
            predicted_label = 0  # Green
        else:
            top_brightness = np.mean(top_region[:, :, 2])
            middle_brightness = np.mean(middle_region[:, :, 2])
            bottom_brightness = np.mean(bottom_region[:, :, 2])

            if top_brightness > middle_brightness and top_brightness > bottom_brightness:
                predicted_label = 1  # Red
            elif middle_brightness > top_brightness and middle_brightness > bottom_brightness:
                predicted_label = 2  # Yellow
            else:
                predicted_label = 0  # Green

    return predicted_label

def load_yolo_cropped_data(image_path, crop_size=(120, 320)):
    cropped_images = []
    
    # Read the image
    img = cv2.imread(image_path)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Run YOLO detection
    results = model(img_rgb, verbose=False)
    
    h, w, _ = img_rgb.shape
    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy()
        for box in boxes:
            x1, y1, x2, y2 = box.astype(int)
            x1 = max(0, x1)
            y1 = max(0, y1)
            x2 = min(w, x2)
            y2 = min(h, y2)
            cropped_img = img_rgb[y1:y2, x1:x2]
            if cropped_img.size == 0 or cropped_img.shape[0] == 0 or cropped_img.shape[1] == 0:
                continue

            resized_img = cv2.resize(cropped_img, crop_size)
            cropped_images.append(resized_img)

    return cropped_images

def image_to_base64(image):
    """Convert an image to base64 string"""
    _, buffer = cv2.imencode('.jpg', cv2.cvtColor(image, cv2.COLOR_RGB2BGR))
    return f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Please provide an image path"}))
        sys.exit(1)
        
    image_path = sys.argv[1]
    
    try:
        # Detect traffic lights
        cropped_images = load_yolo_cropped_data(image_path)
        
        results = []
        class_names = ['Green', 'Red', 'Yellow']
        
        for image in cropped_images:
            label_idx = hsv_improved_classification(image)
            if label_idx is not None:
                results.append({
                    "image": image_to_base64(image),
                    "label": class_names[label_idx]
                })
        
        print(json.dumps({"results": results}))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()

