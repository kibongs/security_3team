# Prerequisite
You need to install NodeJS first.
> - https://nodejs.org/en/
> - Download stable and reliable version.
> - Check node and npm version
>   > node -v, npm -v
> - Install yarn
>   > npm install -g yarn
> - Check yarn version
>   > yarn -v or yarn --version

### Run web client Step
1. Run internal node server
> node src/images/server.js
2. Run react web server
> yarn start

### Important Message
If you want to use video or image files,
they muse exist in the 'src/images' folder

### Certification File
1. ROOTCA : rootca.csr
2. SSL_CRT_FILE : localhost+2.pem
3. SSL_KEY_FILE : localhost+2-key.pem
