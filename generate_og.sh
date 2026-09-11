#!/bin/bash
set -e

FONT="/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"
BG="./src/assets/images/sensor_og_banner_1789109300468.jpg"

# 1. Resize base image to 1200x630
convert "$BG" -resize 1200x630^ -gravity center -extent 1200x630 base_bg.png

# 2. Create gradient overlay for high contrast readability
# Dark slate gradient on the left, keeping the sensor visual on the right
convert -size 1200x630 xc:none \
  -fill "rgba(11, 19, 43, 0.92)" -draw "rectangle 0,0 820,630" \
  -fill "rgba(11, 19, 43, 0.65)" -draw "rectangle 820,0 1200,630" \
  overlay_dark.png

# 3. Combine base and overlay
convert base_bg.png overlay_dark.png -composite step1.png

# 4. Add UI elements & typography
convert step1.png \
  -font "$FONT" \
  \
  `# Top pill badge` \
  -fill "rgba(99, 102, 241, 0.25)" -stroke "rgba(129, 140, 248, 0.6)" -strokewidth 1.5 \
  -draw "roundrectangle 60,60 480,105 10,10" \
  -stroke none -fill "#A5B4FC" -pointsize 20 -weight Bold \
  -draw "text 85,92 '🎙️ SENSOR B2B SALES ASSISTANT'" \
  \
  `# Main Title (Large, crisp, high contrast)` \
  -fill "#FFFFFF" -pointsize 52 -weight Bold \
  -draw "text 60,195 '마케팅 전화상담 질문 생성기'" \
  \
  `# Subtitle` \
  -fill "#94A3B8" -pointsize 26 \
  -draw "text 60,250 '산업용 센서 영업사원을 위한 고객 구매 가능성 판별 솔루션'" \
  \
  `# Divider line` \
  -fill "rgba(148, 163, 184, 0.3)" -stroke none \
  -draw "rectangle 60,285 750,287" \
  \
  `# Feature item 1` \
  -fill "#34D399" -pointsize 22 \
  -draw "text 65,340 '✔'" \
  -fill "#F1F5F9" -pointsize 22 \
  -draw "text 95,340 '통화 전 구매 가능성(BANT) 즉시 판별 맞춤형 5대 질문'" \
  \
  `# Feature item 2` \
  -fill "#34D399" -pointsize 22 \
  -draw "text 65,395 '✔'" \
  -fill "#F1F5F9" -pointsize 22 \
  -draw "text 95,395 '고객 통화 내용 마이크 음성 메모 실시간 자동 받아쓰기'" \
  \
  `# Feature item 3` \
  -fill "#34D399" -pointsize 22 \
  -draw "text 65,450 '✔'" \
  -fill "#F1F5F9" -pointsize 22 \
  -draw "text 95,450 'Google Sheet (구글 스프레드시트) 1초 원클릭 자동 연동'" \
  \
  `# Bottom tags` \
  -fill "rgba(16, 185, 129, 0.2)" -stroke "rgba(52, 211, 153, 0.5)" -strokewidth 1 \
  -draw "roundrectangle 60,520 220,565 8,8" \
  -stroke none -fill "#34D399" -pointsize 18 \
  -draw "text 80,550 '📊 구글시트 연동'" \
  \
  -fill "rgba(239, 68, 68, 0.2)" -stroke "rgba(248, 113, 113, 0.5)" -strokewidth 1 \
  -draw "roundrectangle 235,520 380,565 8,8" \
  -stroke none -fill "#F87171" -pointsize 18 \
  -draw "text 255,550 '🎙️ 마이크 인식'" \
  \
  -fill "rgba(59, 130, 246, 0.2)" -stroke "rgba(96, 165, 250, 0.5)" -strokewidth 1 \
  -draw "roundrectangle 395,520 545,565 8,8" \
  -stroke none -fill "#60A5FA" -pointsize 18 \
  -draw "text 415,550 '⚡ 5대 핵심질문'" \
  \
  `# Right side subtle card tag` \
  -fill "rgba(15, 23, 42, 0.85)" -stroke "rgba(51, 65, 85, 0.8)" -strokewidth 1 \
  -draw "roundrectangle 820,530 1140,575 8,8" \
  -stroke none -fill "#94A3B8" -pointsize 16 \
  -draw "text 840,558 '압력 · 차압 · 온도 · 레벨 · 유량'" \
  \
  public/og-image.jpg

# Also create PNG version and copy to dist
cp public/og-image.jpg public/og-image.png
mkdir -p dist
cp public/og-image.jpg dist/og-image.jpg
cp public/og-image.png dist/og-image.png

# Clean temp files
rm -f base_bg.png overlay_dark.png step1.png

echo "OG image successfully built and saved to public/og-image.jpg (1200x630)"
identify public/og-image.jpg
