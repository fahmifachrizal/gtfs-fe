import React from 'react';
import FileUploader from '../components/gtfs/FileUploader';

const UploadPage = () => {
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold text-center mb-8">Upload GTFS Data</h1>
            <div className="max-w-2xl mx-auto">
                <FileUploader
                    onFileUpload={(file) => console.log('File uploaded:', file.name)}
                />
            </div>
        </div>
    );
};

export default UploadPage;
