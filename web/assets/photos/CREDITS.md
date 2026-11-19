# Photo credits

All photos are from [Unsplash](https://unsplash.com) and were marked **"Free to use under the Unsplash License"** on their photo pages when downloaded (19 Nov 2026). None are Unsplash+ images.

The [Unsplash License](https://unsplash.com/license) allows free commercial and non-commercial use without permission or attribution, but doesn't allow compiling photos into a competing service. We credit the photographers anyway: in the page footer and here.

Every photo is re-graded to the landing palette (desaturated, graphite shadows, warm highlights) and exported as AVIF + WebP at several widths with Pillow. Some are cropped. The people in them are not FaceAttend users or customers, and the photos are illustrative only.

| File prefix | Used for | Photographer | Source |
|---|---|---|---|
| `hero`, `hero-portrait` | Opening, person looking at the camera (cropped; portrait crop for phones) | Vitaly Gariev | https://unsplash.com/photos/a-woman-with-glasses-wearing-a-turtleneck-in-an-office-y96u309OTtM |
| `classroom` | "Calling each name" (diptych) | Vitaly Gariev | https://unsplash.com/photos/professor-lectures-to-students-in-a-classroom-setting-RDf6Cvns88Q |
| `clipboard` | "A sign-in sheet can't tell who is holding the pen" (diptych) | Zulfugar Karimov | https://unsplash.com/photos/hands-writing-on-a-clipboard-with-a-pen-IPeGLFSyhzg |
| `face` | Recognition close-up with the landmark overlay (cropped 4:5) | Nartan Büyükyıldız | https://unsplash.com/photos/man-in-black-crew-neck-shirt-hr_feH2URs0 |
| `enroll` | Step 1, enrolling a face | Vitaly Gariev | https://unsplash.com/photos/man-with-glasses-in-a-modern-office-setting-grbDcbyo9nU |
| `gates` | Step 2, recognized at the door | Martin Leitgeb | https://unsplash.com/photos/stainless-steel-turnstiles-with-status-lights-u5Mm6I8qQC8 |
| `lecture` | Step 3, hours logged against the shift or class | Vitaly Gariev | https://unsplash.com/photos/students-attentively-listening-in-a-lecture-hall-RDBb3JUdOnc |
| `night` | Closing shot | Vitaly Gariev | https://unsplash.com/photos/people-working-late-in-a-modern-office-at-night-v6JKMaqAwZE |

## Face landmarks

`../face-landmarks.json` holds the 478 landmarks and the tesselation edges that MediaPipe FaceLandmarker (`face_landmarker.task`, float16 v1, the same model the backend's `liveness.py` downloads) found on the `face` photo, mapped into the 4:5 crop (800×1000 units). The eye-openness value shown on the page (0.28) is the EAR computed from those landmarks with the backend's six-point formula.
