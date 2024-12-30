// SHA-512 Complete Implementation in JavaScript
const K = [
    0x428a2f98d728ae22n, 0x7137449123ef65cdn, 0xb5c0fbcfec4d3b2fn, 0xe9b5dba58189dbcfn,
    0x3956c25bf348b538n, 0x59f111f1b605d019n, 0x923f82a4af194f9bn, 0xab1c5ed5da6d8118n,
    0xd807aa98a3030242n, 0x12835b0145706fben, 0x243185be4ee4b28cn, 0x550c7dc3d5ffb4e2n,
    0x72be5d74f27b896fn, 0x80deb1fe3b1696b1n, 0x9bdc06a725c71235n, 0xc19bf174cf692694n,
    0xe49b69c19ef14ad2n, 0xefbe4786384f25e3n, 0x0fc19dc68b8cd5b5n, 0x240ca1cc77ac9c65n,
    0x2de92c6f592b0275n, 0x4a7484aa6ea6e483n, 0x5cb0a9dcbd41fbd4n, 0x76f988da831153b5n,
    0x983e5152ee66dfabn, 0xa831c66d2db43210n, 0xb00327c898fb213fn, 0xbf597fc7beef0ee4n,
    0xc6e00bf33da88fc2n, 0xd5a79147930aa725n, 0x06ca6351e003826fn, 0x142929670a0e6e70n,
    0x27b70a8546d22ffcn, 0x2e1b21385c26c926n, 0x4d2c6dfc5ac42aedn, 0x53380d139d95b3dfn,
    0x650a73548baf63den, 0x766a0abb3c77b2a8n, 0x81c2c92e47edaee6n, 0x92722c851482353bn,
    0xa2bfe8a14cf10364n, 0xa81a664bbc423001n, 0xc24b8b70d0f89791n, 0xc76c51a30654be30n,
    0xd192e819d6ef5218n, 0xd69906245565a910n, 0xf40e35855771202an, 0x106aa07032bbd1b8n,
    0x19a4c116b8d2d0c8n, 0x1e376c085141ab53n, 0x2748774cdf8eeb99n, 0x34b0bcb5e19b48a8n,
    0x391c0cb3c5c95a63n, 0x4ed8aa4ae3418acbn, 0x5b9cca4f7763e373n, 0x682e6ff3d6b2b8a3n,
    0x748f82ee5defb2fcn, 0x78a5636f43172f60n, 0x84c87814a1f0ab72n, 0x8cc702081a6439ecn,
    0x90befffa23631e28n, 0xa4506cebde82bde9n, 0xbef9a3f7b2c67915n, 0xc67178f2e372532bn,
    0xca273eceea26619cn, 0xd186b8c721c0c207n, 0xeada7dd6cde0eb1en, 0xf57d4f7fee6ed178n,
    0x06f067aa72176fban, 0x0a637dc5a2c898a6n, 0x113f9804bef90daen, 0x1b710b35131c471bn,
    0x28db77f523047d84n, 0x32caab7b40c72493n, 0x3c9ebe0a15c9bebcn, 0x431d67c49c100d4cn,
    0x4cc5d4becb3e42b6n, 0x597f299cfc657e2an, 0x5fcb6fab3ad6faecn, 0x6c44198c4a475817n
];

function rotateRight(x, n) {
    // Perform a 64-bit right rotation
    return (x >> BigInt(n)) | (x << BigInt(64 - n)) & 0xffffffffffffffffn;
}

function preprocess(input) {
    // Convert input to a binary string and pad it according to SHA-512 specifications
    const inputBytes = new TextEncoder().encode(input);
    const bitLength = BigInt(inputBytes.length * 8);

    // Add a single '1' bit
    let binaryString = Array.from(inputBytes, byte => byte.toString(2).padStart(8, '0')).join('') + '1';

    // Pad with '0' bits until the length is congruent to 896 mod 1024
    while ((binaryString.length % 1024) !== 896) {
        binaryString += '0';
    }

    // Append the original message length as a 128-bit big-endian integer
    binaryString += bitLength.toString(2).padStart(128, '0');

    // Split into 1024-bit chunks
    const chunks = [];
    for (let i = 0; i < binaryString.length; i += 1024) {
        chunks.push(binaryString.slice(i, i + 1024).match(/.{1,64}/g).map(bin => BigInt(`0b${bin}`)));
    }

    return chunks;
}

function sha512(input) {
    // Initial hash values
    let H = [
        0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn, 0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
        0x510e527fade682d1n, 0x9b05688c2b3e6c1fn, 0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n
    ];

    // Preprocessing: pad the input
    const chunks = preprocess(input);

    for (const chunk of chunks) {
        // Message schedule array W
        const W = new Array(80).fill(0n);

        // Prepare the first 16 words of W
        for (let t = 0; t < 16; t++) {
            W[t] = chunk[t];
        }

        // Prepare the remaining 64 words of W
        for (let t = 16; t < 80; t++) {
            const s0 = rotateRight(W[t - 15], 1) ^ rotateRight(W[t - 15], 8) ^ (W[t - 15] >> 7n);
            const s1 = rotateRight(W[t - 2], 19) ^ rotateRight(W[t - 2], 61) ^ (W[t - 2] >> 6n);
            W[t] = (W[t - 16] + s0 + W[t - 7] + s1) & 0xffffffffffffffffn;
        }

        // Initialize working variables with the current hash value
        let [a, b, c, d, e, f, g, h] = H;

        // Compression function main loop
        for (let t = 0; t < 80; t++) {
            const S1 = rotateRight(e, 14) ^ rotateRight(e, 18) ^ rotateRight(e, 41);
            const ch = (e & f) ^ (~e & g);
            const temp1 = (h + S1 + ch + K[t] + W[t]) & 0xffffffffffffffffn;
            const S0 = rotateRight(a, 28) ^ rotateRight(a, 34) ^ rotateRight(a, 39);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const temp2 = (S0 + maj) & 0xffffffffffffffffn;

            h = g;
            g = f;
            f = e;
            e = (d + temp1) & 0xffffffffffffffffn;
            d = c;
            c = b;
            b = a;
            a = (temp1 + temp2) & 0xffffffffffffffffn;
        }

        // Update the hash values
        H = H.map((h, i) => (h + [a, b, c, d, e, f, g, h][i]) & 0xffffffffffffffffn);
    }

    // Produce the final hash value as a hex string
    return H.map(h => h.toString(16).padStart(16, '0')).join('');
}