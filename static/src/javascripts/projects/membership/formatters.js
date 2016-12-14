export default {
    formatAmount(amount, glyph) {
        return amount ? glyph + (amount / 100).toFixed(2) : 'FREE';
    },
    formatDate(timestamp) {
        const options = {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        };
        return (new Date(timestamp)).toLocaleDateString('en-GB', options);
    },
};
