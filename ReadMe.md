# Traffic Light Detection and Classification

## Team details :

*   Kevin Saji Jacob - 221IT038
*   Sricharan Sridhar - 221IT066

###  Dataset Fetched from Roboflow : cinTA_v2-1
The dataset has preprocessing done in size, and augmentation
Image sizes are of size 416 x 416 x 3 (3 channels for colors)

### Bounding Box detection using Yolo11
We manually find bounding box information for the training images using the labels, while we train it using yolov11 so that we can apply it on the test image input to the system

### HSV Classification (Hue, Saturation Value)
We perform this calculation to classify the images as either green, red or yellow (colors of the traffic light). We use this to also get the required metrics to be printed.

### Integration of Step 2 and 3
We take a test image, find the bounding box using yolo11 model, and then feed this information along with the label of the pixel values of the bounding box image, the labelled color from the labelled path. The image is fed to the HSV classification to give the prediction and then it is compared with the label to get the accuracy and other required metrics.

### Front-end
A simple front-end was developed using Typescript and Next.js with the ML part as a backend, which enables interactive user input with required outputs. The users will be able to download the result with the click of a button.