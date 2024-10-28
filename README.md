### MP3 player

This is a next.js project that uses the shadcn/ui library. It is a simple mp3 player that allows you to play, pause, and skip tracks. You can browse a S3 bucket of mp3 files and play them. The S3 path is hardcoded to the bucket that contains the mp3 files for this project. It is deployed to AWS CloudFront. Optionally add user authentication.

### How to run

1. Clone the repo
2. Run `npm install`
3. Run `npm run dev`

### How to use

1. Click on the "Browse" button to see a list of mp3 files in the S3 bucket.
2. Click on a file to play it.
3. Use the play/pause button to play or pause the current track.
4. Use the skip buttons to skip to the next or previous track.

### How to deploy

1. Run `npm run build`
2. Run `npm run deploy`

