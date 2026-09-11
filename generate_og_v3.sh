#!/bin/bash
set -e

FONT="/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"
BG="./src/assets/images/new_sensor_og_banner_1789109924124.jpg"

# 1. Resize base image to exact 1200x630 OpenGraph dimensions
convert "$BG" -resize 1200x630^ -gravity center -extent 1200x630 base_bg.png

# 2. Add an ultra-sleek high-contrast dark gradient on the left half (0 to 780px)
# so typography is razor sharp and readable, while highlighting the 3D sensor and audio waveforms on the right
convert -size 1200x630 xc:none \
  -fill "rgba(10, 15, 30, 0.94)" -draw "rectangle 0,0 780,630" \
  -fill "rgba(10, 15, 30, 0.70)" -draw "rectangle 780,0 1200,630" \
  overlay_dark.png

convert base_bg.png overlay_dark.png -composite step1.png

# 3. Add refined typography and UI badges
convert step1.png \
  -font "$FONT" \
  \
  `# Subtle border accent frame` \
  -stroke "rgba(99, 102, 241, 0.35)" -strokewidth 1 -fill none \
  -draw "roundrectangle 20,20 1180,610 16,16" \
  \
  `# Category Badge (Top left)` \
  -fill "rgba(79, 70, 229, 0.3)" -stroke "rgba(129, 140, 248, 0.7)" -strokewidth 1.5 \
  -draw "roundrectangle 60,55 490,102 10,10" \
  -stroke none -fill "#C7D2FE" -pointsize 19 -weight Bold \
  -draw "text 80,88 '🎙️ B2B SENSOR SALES AI ASSISTANT'" \
  \
  `# Main Headline (Crisp, High Contrast)` \
  -fill "#FFFFFF" -pointsize 50 -weight Bold \
  -draw "text 60,185 '마케팅 전화상담 질문 생성기'" \
  \
  `# Sub-headline` \
  -fill "#94A3B8" -pointsize 24 \
  -draw "text 60,238 '산업용 센서 영업 상담 5대 핵심질문 & 실시간 음성 메모'" \
  \
  `# Gradient-like Accent Line` \
  -fill "#3B82F6" -draw "rectangle 60,268 280,271" \
  -fill "#10B981" -draw "rectangle 280,268 500,271" \
  -fill "rgba(148, 163, 184, 0.25)" -draw "rectangle 500,268 740,271" \
  \
  `# Key Benefit 1` \
  -fill "#10B981" -pointsize 22 \
  -draw "text 65,325 '✔'" \
  -fill "#F8FAFC" -pointsize 21 \
  -draw "text 95,325 '통화 전 BANT 구매 가능성 즉시 판별 맞춤형 5대 질문'" \
  \
  `# Key Benefit 2` \
  -fill "#10B981" -pointsize 22 \
  -draw "text 65,375 '✔'" \
  -fill "#F8FAFC" -pointsize 21 \
  -draw "text 95,375 '통화 중 마이크 음성 메모 자동 텍스트 변환 & 요약'" \
  \
  `# Key Benefit 3` \
  -fill "#10B981" -pointsize 22 \
  -draw "text 65,425 '✔'" \
  -fill "#F8FAFC" -pointsize 21 \
  -draw "text 95,425 'Google Sheets (구글 스프레드시트) 실시간 원클릭 저장'" \
  \
  `# Bottom Feature Pills` \
  -fill "rgba(16, 185, 129, 0.18)" -stroke "rgba(52, 211, 153, 0.6)" -strokewidth 1 \
  -draw "roundrectangle 60,490 225,538 8,8" \
  -stroke none -fill "#34D399" -pointsize 17 \
  -draw "text 78,521 '📊 구글시트 연동'" \
  \
  -fill "rgba(239, 68, 68, 0.18)" -stroke "rgba(248, 113, 113, 0.6)" -strokewidth 1 \
  -draw "roundrectangle 240,490 395,538 8,8" \
  -stroke none -fill "#F87171" -pointsize 17 \
  -draw "text 258,521 '🎙️ 마이크 인식'" \
  \
  -fill "rgba(59, 130, 246, 0.18)" -stroke "rgba(96, 165, 250, 0.6)" -strokewidth 1 \
  -draw "roundrectangle 410,490 565,538 8,8" \
  -stroke none -fill "#60A5FA" -pointsize 17 \
  -draw "text 428,521 '⚡ 5대 핵심질문'" \
  \
  `# Right side product types badge` \
  -fill "rgba(15, 23, 42, 0.88)" -stroke "rgba(71, 85, 105, 0.7)" -strokewidth 1 \
  -draw "roundrectangle 760,545 1140,592 8,8" \
  -stroke none -fill "#CBD5E1" -pointsize 15 \
  -draw "text 778,574 '압력센서 · 차압센서 · 온도센서 · 레벨센서 · 유량센서'" \
  \
  public/og-image.jpg

# Also create PNG & sync to dist and assets
cp public/og-image.jpg public/og-image.png
cp public/og-image.jpg src/assets/og-image.jpg
mkdir -p dist
cp public/og-image.jpg dist/og-image.jpg
cp public/og-image.png dist/og-image.png

rm -f base_bg.png overlay_dark.png step1.png
echo "OG image generation complete!"
identify public/og-image.jpg
