// 卡通服装图形库：每件衣物 = 基础轮廓 + 细节线（64×64 描边简笔，currentColor 随层色）
// 目标：用户一眼看懂是哪件衣服（背心无袖、羽绒服蓬松有缝线、雨披带帽…）

export interface GarmentArt {
  /** 主轮廓 */
  body: string
  /** 细节线（纹理/领子/口袋/缝线，细一号描边） */
  details?: string[]
}

// ---------- 复用基础形 ----------
/** 短袖 T 恤形 */
const TEE =
  'M22 14 C26 19 38 19 42 14 L44 21 L54 27 L51 35 L44 32 L44 52 L20 52 L20 32 L13 35 L10 27 L20 21 Z'
/** 长袖上装形（下摆 52） */
const LS =
  'M22 14 C26 19 38 19 42 14 L44 21 L56 43 L49 48 L44 37 L44 52 L20 52 L20 37 L15 48 L8 43 L20 21 Z'
/** 蓬袖长款（羽绒/棉服，下摆 54） */
const PUFF_LS =
  'M22 16 C26 20 38 20 42 16 L45 23 L57 41 L50 47 L44 36 L44 54 L20 54 L20 36 L14 47 L7 41 L19 23 Z'
/** 短夹克形（下摆 50） */
const JACKET =
  'M22 16 C26 20 38 20 42 16 L45 23 L56 42 L49 47 L44 36 L44 50 L20 50 L20 36 L15 47 L8 42 L19 23 Z'
/** 长外衣形（下摆 56） */
const COAT =
  'M22 18 C26 22 38 22 42 18 L45 25 L56 42 L49 47 L44 37 L44 56 L20 56 L20 37 L15 47 L8 42 L19 25 Z'
/** 蓬松长外衣（长羽绒/派克） */
const PUFF_COAT =
  'M22 18 L45 25 L57 41 L50 46 L44 36 L44 56 L20 56 L20 36 L14 46 L7 41 L18 25 Z'
/** 长裤 */
const PANTS = 'M21 16 L43 16 L45 54 L36 54 L32 30 L28 54 L19 54 Z'
/** 短裤 */
const SHORTS = 'M21 16 L43 16 L47 38 L33 38 L32 26 L31 38 L17 38 Z'

/** 连帽（画在领口上方） */
const HOOD = 'M24 16 C24 5 40 5 40 16'

export const GARMENT_ART: Record<string, GarmentArt> = {
  // ---------- 贴身上装 ----------
  t_tank: { body: 'M24 12 C28 17 36 17 40 12 L42 52 L22 52 Z' },
  t_cotton_under: { body: 'M24 12 C28 17 36 17 40 12 L42 52 L22 52 Z', details: ['M26 20 L26 46'] },
  t_short: { body: TEE },
  t_tee: { body: TEE, details: ['M26 24 L26 46'] },
  t_sport_tee: { body: TEE, details: ['M27 33 L37 33', 'M25 39 L39 39'] },
  t_polo: {
    body: TEE,
    details: ['M22 14 L27 19 L32 15 L37 19 L42 14', 'M32 19 L32 28'],
  },
  t_longsleeve: { body: LS },
  t_wool_base: { body: LS, details: ['M26 10 L38 10 L38 14 L26 14'] },
  t_silk_base: { body: LS, details: ['M36 24 C38 30 38 40 36 46'] },
  t_thermal_top: {
    body: LS,
    details: ['M20 38 C24 35 28 41 32 38 C36 35 40 41 44 38', 'M20 46 C24 43 28 49 32 46 C36 43 40 49 44 46'],
  },

  // ---------- 贴身下装 ----------
  b_shorts: { body: SHORTS },
  b_swim_short: { body: SHORTS, details: ['M23 22 L25 36', 'M41 22 L39 36'] },
  b_chinos: { body: PANTS, details: ['M24 20 L28 24', 'M40 20 L36 24'] },
  b_jeans: { body: PANTS, details: ['M21 22 L43 22', 'M24 22 L27 27', 'M40 22 L37 27', 'M32 30 L32 54'] },
  b_leggings: { body: 'M26 16 L38 16 L40 54 L34 54 L32 26 L30 54 L24 54 Z' },
  b_thermal_leg: {
    body: PANTS,
    details: ['M20 42 C23 40 26 44 29 42', 'M35 42 C38 40 41 44 44 42'],
  },
  b_wool_pants: { body: PANTS, details: ['M19 49 L28 49', 'M36 49 L45 49'] },
  b_cargo: { body: PANTS, details: ['M21 34 L26 34 L26 40 L21 40 Z', 'M43 34 L38 34 L38 40 L43 40 Z'] },
  b_trousers_loose: { body: 'M19 16 L45 16 L50 54 L36 54 L32 26 L28 54 L14 54 Z' },

  // ---------- 保暖层 ----------
  i_hoodie: { body: LS, details: [HOOD, 'M26 48 C30 44 34 44 38 48'] },
  i_cardigan: { body: LS, details: ['M22 14 L32 25 L42 14', 'M32 25 L32 52'] },
  i_sweater: { body: LS, details: ['M20 47 L44 47', 'M20 50 L44 50'] },
  i_fleece: {
    body: LS,
    details: ['M26 32 L26 34', 'M32 36 L32 38', 'M38 32 L38 34', 'M29 42 L29 44', 'M35 42 L35 44'],
  },
  i_down_layer: { body: PUFF_LS, details: ['M20 32 L44 32', 'M20 42 L44 42'] },
  i_vest: { body: 'M24 12 L21 52 L43 52 L40 12', details: ['M24 12 L32 24 L40 12'] },
  i_denim_jacket: {
    body: JACKET,
    details: ['M22 16 L27 21 L32 17 L37 21 L42 16', 'M25 29 L30 29 L30 34 L25 34 Z', 'M34 29 L39 29 L39 34 L34 34 Z', 'M32 21 L32 50'],
  },
  i_blazer: { body: JACKET, details: ['M22 16 L32 27 L42 16', 'M32 27 L32 50'] },
  i_bomber: {
    body: JACKET,
    details: ['M26 13 L38 13 L38 16 L26 16', 'M20 45 L44 45', 'M20 49 L44 49'],
  },
  i_padded_jacket: { body: PUFF_LS, details: ['M20 30 L44 30', 'M20 38 L44 38', 'M20 46 L44 46'] },
  i_quilted_vest: {
    body: 'M24 12 L20 54 L44 54 L40 12',
    details: ['M24 12 L32 24 L40 12', 'M21 34 L43 34', 'M21 44 L43 44'],
  },
  i_mid_cotton: { body: LS },
  i_skirt_thick: { body: 'M22 16 L42 16 L48 52 L16 52 Z', details: ['M22 22 L42 22'] },

  // ---------- 防护层 ----------
  p_windbreaker: { body: JACKET, details: ['M32 20 L32 50', 'M24 34 L28 38', 'M40 34 L36 38'] },
  p_raincoat: { body: COAT, details: ['M26 14 C26 6 38 6 38 14', 'M32 22 L32 56'] },
  p_hardshell: { body: JACKET, details: ['M24 14 C24 7 40 7 40 14', 'M32 20 L32 50'] },
  p_softshell: { body: JACKET, details: ['M32 20 L32 50', 'M20 45 L44 45'] },
  p_down_coat: { body: PUFF_COAT, details: ['M24 12 C24 4 40 4 40 12', 'M20 34 L46 34', 'M20 46 L46 46'] },
  p_parajumpers: {
    body: PUFF_COAT,
    details: ['M24 12 C24 4 40 4 40 12', 'M25 13 C27 9 37 9 39 13', 'M20 36 L46 36', 'M20 47 L46 47'],
  },
  p_sun_jacket: {
    body: JACKET,
    details: ['M32 20 L32 50', 'M32 27 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0', 'M32 21 L32 23', 'M32 31 L32 33', 'M27 27 L25 27', 'M37 27 L39 27'],
  },
  p_trench: { body: COAT, details: ['M20 36 L46 36', 'M22 18 L27 23 L32 19 L37 23 L42 18'] },
  p_swim_jacket: { body: JACKET, details: ['M24 14 C24 7 40 7 40 14', 'M32 20 L32 50', 'M24 24 L40 24'] },
  p_vintage: {
    body: JACKET,
    details: ['M22 16 L27 21 L32 17 L37 21 L42 16', 'M32 25 L32 27', 'M32 33 L32 35', 'M32 41 L32 43'],
  },
  p_umbrella_vest: { body: JACKET, details: [HOOD, 'M32 20 L32 50'] },
  p_pvc_poncho: {
    body: 'M18 26 L32 13 L46 26 L50 54 L14 54 Z',
    details: ['M26 21 C26 14 38 14 38 21', 'M32 26 L32 54'],
  },
  p_linen_jacket: { body: JACKET, details: ['M32 22 L32 50', 'M22 16 L27 21 L32 17 L37 21 L42 16'] },
}
