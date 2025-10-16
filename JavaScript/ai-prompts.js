/**
 * AI Image Generation Prompts Library
 * 高质量AI图片生成提示词库
 */

const AIPrompts = {
    prompts: [
        {
            title: "广角环境 - 马厩走道",
            badge: "推荐",
            category: "环境场景 · 走道构图",
            style: "电影感广角",
            lighting: "冷色调，门缝透光",
            contrast: "低对比度",
            atmosphere: "阴冷昏暗，扬尘弥漫",
            text: `阴冷昏暗的马厩走道，成排木栏，门缝透入一束冷色光，扬尘和雾气弥漫；一匹马在栏位旁，身边是散落的草料和草捆，无人，质感粗粝，低对比，电影感广角`,
            textEN: `Cold, dimly lit stable corridor, rows of wooden stalls, beam of cold-toned light seeping through door gaps, dust and mist floating in the air; a horse standing by the stall, scattered hay and hay bales around, no people, rough texture, low contrast, cinematic wide-angle shot, atmospheric lighting, moody environment, photorealistic, 8k, highly detailed`
        },
        {
            title: "背光剪影 - 层次氛围",
            badge: "专业",
            category: "氛围场景 · 剪影构图",
            style: "高动态范围",
            lighting: "背光，微弱天光",
            contrast: "低调光",
            atmosphere: "尘埃漂浮，氛围感强",
            text: `低光环境的石砌马厩，门外微弱天光形成背光，尘埃漂浮；马呈半剪影站立在草料堆旁，饲料槽中可见干草，无人，低调光，高动态范围，氛围感强`,
            textEN: `Low-light stone-built stable interior, faint skylight from doorway creating backlight, floating dust particles; horse in half-silhouette standing beside hay pile, dry hay visible in feeding trough, no people, low-key lighting, high dynamic range, strong atmospheric mood, dramatic lighting, cinematic composition, photorealistic, volumetric lighting, 8k, ultra detailed`
        },
        {
            title: "马厩细节 - 近景特写",
            badge: "精选",
            category: "细节场景 · 特写构图",
            style: "质感强化",
            lighting: "侧光，纹理清晰",
            contrast: "中等对比",
            atmosphere: "宁静沉稳",
            text: `马厩内部细节特写，木质栏杆纹理清晰，侧光照射下显出粗糙质感；马头探出栏杆，眼神平静，稻草和饲料细节丰富，暖黄色调，静谧氛围`,
            textEN: `Close-up detail of stable interior, wooden fence texture clearly visible, side lighting revealing rough texture; horse head leaning over the fence, calm eyes, rich details of straw and feed, warm yellow tones, serene atmosphere, photorealistic, macro photography style, shallow depth of field, 8k resolution`
        },
        {
            title: "晨光马厩 - 自然光影",
            badge: "唯美",
            category: "光影场景 · 自然光",
            style: "自然写实",
            lighting: "清晨柔光",
            contrast: "柔和对比",
            atmosphere: "温暖宁静",
            text: `清晨的马厩，柔和晨光透过木板缝隙洒入，形成光束效果；马匹安静站立，空气中的灰尘在光线中闪烁，木质结构和干草呈现温暖色调，宁静祥和的氛围`,
            textEN: `Morning stable scene, soft morning light streaming through wooden plank gaps creating light beam effects; horses standing quietly, dust particles glittering in the light rays, wooden structures and hay in warm tones, peaceful and serene atmosphere, natural lighting, golden hour, cinematic composition, photorealistic, 8k, highly detailed`
        }
    ],
    
    /**
     * 获取所有提示词
     */
    getAllPrompts: function() {
        return this.prompts;
    },
    
    /**
     * 根据索引获取提示词
     */
    getPromptByIndex: function(index) {
        if (index >= 0 && index < this.prompts.length) {
            return this.prompts[index];
        }
        return null;
    },
    
    /**
     * 根据类别筛选提示词
     */
    getPromptsByCategory: function(category) {
        return this.prompts.filter(p => p.category.includes(category));
    },
    
    /**
     * 搜索提示词
     */
    searchPrompts: function(keyword) {
        const lowerKeyword = keyword.toLowerCase();
        return this.prompts.filter(p => 
            p.title.toLowerCase().includes(lowerKeyword) ||
            p.text.toLowerCase().includes(lowerKeyword) ||
            p.category.toLowerCase().includes(lowerKeyword)
        );
    }
};

// 导出到全局作用域
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIPrompts;
}
