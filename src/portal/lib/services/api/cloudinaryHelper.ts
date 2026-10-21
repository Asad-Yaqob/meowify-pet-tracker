/**
 * Utility to optimize Cloudinary URLs by adding transformation parameters.
 */

interface CloudinaryOptions {
    width?: number;
    height?: number;
    quality?: string | number;
    format?: string;
    crop?: string;
    resourceType?: 'image' | 'video';
}

export const getOptimizedCloudinaryUrl = (url: string | undefined, options: CloudinaryOptions = {}) => {
    if (!url) return '';

    // If it's not a cloudinary URL, return as is
    if (!url.includes('cloudinary.com')) return url;

    const {
        width,
        height,
        quality = 'auto',
        format = 'auto',
        crop = 'fill',
        resourceType = 'image'
    } = options;

    // Transformation string
    let transformations = `f_${format},q_${quality}`;

    if (width) transformations += `,w_${width}`;
    if (height) transformations += `,h_${height}`;
    if (crop && (width || height)) transformations += `,c_${crop}`;

    // For videos, use vc_auto for codec optimization
    if (resourceType === 'video') {
        transformations += ',vc_auto';
    }

    // Replace 'upload/' with 'upload/transformations/'
    // Cloudinary URLs typically look like: https://res.cloudinary.com/demo/image/upload/v12345678/sample.jpg
    // We want: https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v12345678/sample.jpg

    // Use regex to find the /upload/ part and insert transformations after it
    const parts = url.split('/upload/');
    if (parts.length === 2) {
        return `${parts[0]}/upload/${transformations}/${parts[1]}`;
    }

    return url;
};
