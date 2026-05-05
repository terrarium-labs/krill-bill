const uploadFile = async (resp:any, file:any, onProgress:any) => {
    if (resp) {
        const { upload_method, upload_uri, upload_headers, content_url } = resp;
        if (upload_method === 'PUT') {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', upload_uri);
                // Set headers
                Object.keys(upload_headers).forEach((key) => {
                    if (key !== 'content-length') {
                        xhr.setRequestHeader(key, upload_headers[key]);
                    }
                });
                // Track progress
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable && onProgress) {
                        const percentComplete = Math.round((event.loaded / event.total) * 100);
                        onProgress(percentComplete);
                    }
                };
                // Handle completion
                xhr.onload = () => {
                    if (xhr.status === 200) {
                        resolve(content_url);
                    } else {
                        reject(new Error(`Upload failed with status ${xhr.status} ${xhr.statusText}`));
                    }
                };
                // Handle errors
                xhr.onerror = () => {
                    reject(new Error('Upload failed due to a network error'));
                };
                xhr.send(file);
            });
        }
    }
};

export { uploadFile };
