export default function cloudinaryLoader({ src, width, quality }) {
    const params = ['f_auto', 'c_limit', `w_${width}`, `q_${quality || 'auto'}`];

    // If it's already a full URL, split and insert params
    if (src.includes('res.cloudinary.com')) {
        const [base, path] = src.split('/upload/');
        if (path) {
            return `${base}/upload/${params.join(',')}/${path}`;
        }
    }

    // Return original src if not a Cloudinary URL to avoid breaking other images
    return src;
}
