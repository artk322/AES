function AES_Init() {
  AES_Sbox_Inv = new Array(256);
  for (let i = 0; i < 256; i++)
    AES_Sbox_Inv[AES_Sbox[i]] = i;

  AES_ShiftRowTab_Inv = new Array(16);
  for (let i = 0; i < 16; i++)
    AES_ShiftRowTab_Inv[AES_ShiftRowTab[i]] = i;

  AES_xtime = new Array(256);
  for (let i = 0; i < 128; i++) {
    AES_xtime[i] = i << 1;
    AES_xtime[128 + i] = (i << 1) ^ 0x1b;
  }
}

function AES_Done() {
  delete AES_Sbox_Inv;
  delete AES_ShiftRowTab_Inv;
  delete AES_xtime;
}

function AES_ExpandKey(key) {
  const kl = key.length;
  let ks, Rcon = 1;
  switch (kl) {
    case 16:
      ks = 16 * (10 + 1);
      break;
    case 24:
      ks = 16 * (12 + 1);
      break;
    case 32:
      ks = 16 * (14 + 1);
      break;
    default:
      alert("AES_ExpandKey: Only key lengths of 16, 24 or 32 bytes allowed!");
  }
  for (let i = kl; i < ks; i += 4) {
    let temp = key.slice(i - 4, i);
    if (i % kl == 0) {
      temp = new Array(AES_Sbox[temp[1]] ^ Rcon, AES_Sbox[temp[2]],
        AES_Sbox[temp[3]], AES_Sbox[temp[0]]);
      if ((Rcon <<= 1) >= 256)
        Rcon ^= 0x11b;
    } else if ((kl > 24) && (i % kl == 16))
      temp = new Array(AES_Sbox[temp[0]], AES_Sbox[temp[1]],
        AES_Sbox[temp[2]], AES_Sbox[temp[3]]);
    for (let j = 0; j < 4; j++)
      key[i + j] = key[i + j - kl] ^ temp[j];
  }
}

function AES_Encrypt(block, key) {
  const l = key.length;
  let i;
  AES_AddRoundKey(block, key.slice(0, 16)); // initial round
  for (i = 16; i < l - 16; i += 16) {
    AES_SubBytes(block, AES_Sbox);
    AES_ShiftRows(block, AES_ShiftRowTab);
    AES_MixColumns(block);
    AES_AddRoundKey(block, key.slice(i, i + 16));
  }
  // last round
  AES_SubBytes(block, AES_Sbox);
  AES_ShiftRows(block, AES_ShiftRowTab);
  AES_AddRoundKey(block, key.slice(i, l));
}

function AES_Decrypt(block, key) {
  // обратный порядок ecnrypt
  const l = key.length;
  let i;
  AES_AddRoundKey(block, key.slice(l - 16, l));
  AES_ShiftRows(block, AES_ShiftRowTab_Inv);
  AES_SubBytes(block, AES_Sbox_Inv);
  for (i = l - 32; i >= 16; i -= 16) {
    AES_AddRoundKey(block, key.slice(i, i + 16));
    AES_MixColumns_Inv(block);
    AES_ShiftRows(block, AES_ShiftRowTab_Inv);
    AES_SubBytes(block, AES_Sbox_Inv);
  }
  AES_AddRoundKey(block, key.slice(0, 16));
}

/******************************************************************************/
// AES_Sbox = [
//   0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
//   0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
//   0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
//   0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
//   0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
//   0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
//   0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
//   0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
//   0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
//   0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
//   0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
//   0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
//   0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
//   0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
//   0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
//   0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
// ]
AES_Sbox = [
  99, 124, 119, 123, 242, 107, 111, 197, 48, 1, 103, 43, 254, 215, 171,
  118, 202, 130, 201, 125, 250, 89, 71, 240, 173, 212, 162, 175, 156, 164, 114, 192, 183, 253,
  147, 38, 54, 63, 247, 204, 52, 165, 229, 241, 113, 216, 49, 21, 4, 199, 35, 195, 24, 150, 5, 154,
  7, 18, 128, 226, 235, 39, 178, 117, 9, 131, 44, 26, 27, 110, 90, 160, 82, 59, 214, 179, 41, 227,
  47, 132, 83, 209, 0, 237, 32, 252, 177, 91, 106, 203, 190, 57, 74, 76, 88, 207, 208, 239, 170,
  251, 67, 77, 51, 133, 69, 249, 2, 127, 80, 60, 159, 168, 81, 163, 64, 143, 146, 157, 56, 245,
  188, 182, 218, 33, 16, 255, 243, 210, 205, 12, 19, 236, 95, 151, 68, 23, 196, 167, 126, 61,
  100, 93, 25, 115, 96, 129, 79, 220, 34, 42, 144, 136, 70, 238, 184, 20, 222, 94, 11, 219, 224,
  50, 58, 10, 73, 6, 36, 92, 194, 211, 172, 98, 145, 149, 228, 121, 231, 200, 55, 109, 141, 213,
  78, 169, 108, 86, 244, 234, 101, 122, 174, 8, 186, 120, 37, 46, 28, 166, 180, 198, 232, 221,
  116, 31, 75, 189, 139, 138, 112, 62, 181, 102, 72, 3, 246, 14, 97, 53, 87, 185, 134, 193, 29,
  158, 225, 248, 152, 17, 105, 217, 142, 148, 155, 30, 135, 233, 206, 85, 40, 223, 140, 161,
  137, 13, 191, 230, 66, 104, 65, 153, 45, 15, 176, 84, 187, 22
];

AES_ShiftRowTab = [
  0, 5, 10, 15,
  4, 9, 14, 3,
  8, 13, 2, 7,
  12, 1, 6, 11
];

function AES_SubBytes(state, sbox) {
  for (let i = 0; i < 16; i++)
    state[i] = sbox[state[i]];
}

function AES_ShiftRows(state, shifttab) {
  const h = new Array().concat(state);
  for (let i = 0; i < 16; i++)
    state[i] = h[shifttab[i]];
}

function AES_MixColumns(state) {
  for (let i = 0; i < 16; i += 4) {
    let s0 = state[i + 0],
      s1 = state[i + 1];
    let s2 = state[i + 2],
      s3 = state[i + 3];
    let h = s0 ^ s1 ^ s2 ^ s3;
    state[i + 0] ^= h ^ AES_xtime[s0 ^ s1];
    state[i + 1] ^= h ^ AES_xtime[s1 ^ s2];
    state[i + 2] ^= h ^ AES_xtime[s2 ^ s3];
    state[i + 3] ^= h ^ AES_xtime[s3 ^ s0];
  }
}

function AES_MixColumns_Inv(state) {
  for (let i = 0; i < 16; i += 4) {
    let s0 = state[i + 0],
      s1 = state[i + 1];
    let s2 = state[i + 2],
      s3 = state[i + 3];
    let h = s0 ^ s1 ^ s2 ^ s3;
    let xh = AES_xtime[h];
    let h1 = AES_xtime[AES_xtime[xh ^ s0 ^ s2]] ^ h;
    let h2 = AES_xtime[AES_xtime[xh ^ s1 ^ s3]] ^ h;
    state[i + 0] ^= h1 ^ AES_xtime[s0 ^ s1];
    state[i + 1] ^= h2 ^ AES_xtime[s1 ^ s2];
    state[i + 2] ^= h1 ^ AES_xtime[s2 ^ s3];
    state[i + 3] ^= h2 ^ AES_xtime[s3 ^ s0];
  }
}

function AES_AddRoundKey(state, rkey) {
  for (let i = 0; i < 16; i++)
    state[i] ^= rkey[i];
}