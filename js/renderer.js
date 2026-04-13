/**
 * Handles custom drawing of landmarks, skeleton, and gameplay elements.
 */

function getCenterOfMass(landmarks, indices) {
    let x = 0, y = 0, z = 0, count = 0;
    indices.forEach(idx => {
        if (landmarks[idx]) {
            x += landmarks[idx].x;
            y += landmarks[idx].y;
            z += landmarks[idx].z;
            count++;
        }
    });
    if (count === 0) return null;
    return { x: x / count, y: y / count, z: z / count };
}

function drawLine(ctx, p1, p2, color = '#00FF00', width = 4) {
    if (!p1 || !p2) return;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.stroke();
}

function drawPoint(ctx, p, color = '#FF0000', radius = 6) {
    if (!p) return;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}

/**
 * Draws a futuristic play area border
 */
function drawPlayArea(ctx, x, y, size, color = '#00f2ff') {
    ctx.save();
    
    // Subtle outer glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    
    // Draw corners
    const cornerLen = 40;
    const thickness = 4;
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';

    // Top Left
    ctx.beginPath();
    ctx.moveTo(x, y + cornerLen);
    ctx.lineTo(x, y);
    ctx.lineTo(x + cornerLen, y);
    ctx.stroke();

    // Top Right
    ctx.beginPath();
    ctx.moveTo(x + size - cornerLen, y);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x + size, y + cornerLen);
    ctx.stroke();

    // Bottom Right
    ctx.beginPath();
    ctx.moveTo(x + size, y + size - cornerLen);
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x + size - cornerLen, y + size);
    ctx.stroke();

    // Bottom Left
    ctx.beginPath();
    ctx.moveTo(x + cornerLen, y + size);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x, y + size - cornerLen);
    ctx.stroke();

    // Semi-transparent fill for the non-playable area
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    // Top
    ctx.fillRect(0, 0, ctx.canvas.width, y); 
    // Bottom
    ctx.fillRect(0, y + size, ctx.canvas.width, ctx.canvas.height - (y + size)); 
    // Left
    ctx.fillRect(0, y, x, size); 
    // Right
    ctx.fillRect(x + size, y, ctx.canvas.width - (x + size), size); 

    // Pulse effect for the play area label
    const pulse = (Math.sin(Date.now() / 500) + 1) / 2;
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.fillStyle = `rgba(0, 242, 255, ${0.3 + pulse * 0.7})`;
    ctx.textAlign = 'center';
    
    // Un-mirror text (counteracting CSS flip)
    ctx.save();
    ctx.translate(x + size / 2, y + size - 10);
    ctx.scale(-1, 1);
    ctx.fillText('ACTIVE PLAY ZONE', 0, 0);
    ctx.restore();

    ctx.restore();
}

export function drawPose(ctx, results, video, canvas, gameplayManager = null) {
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Gameplay Elements (if active)
    const vWidth = video.videoWidth;
    const vHeight = video.videoHeight;
    const minDim = Math.min(vWidth, vHeight);
    const sx = (vWidth - minDim) / 2;
    const sy = (vHeight - minDim) / 2;

    if (gameplayManager && gameplayManager.gameStarted) {
        // Draw the play area boundary
        drawPlayArea(ctx, sx, sy, minDim);

        gameplayManager.getBubbles().forEach(bubble => {
            if (bubble.isPopped) {
                // Flash explosion
                ctx.beginPath();
                ctx.arc(bubble.x, bubble.y, bubble.radius * (1 + bubble.popTimer/5), 0, Math.PI * 2);
                ctx.strokeStyle = bubble.color;
                ctx.lineWidth = 3 * (1 - bubble.popTimer/10);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
                const gradient = ctx.createRadialGradient(
                    bubble.x - bubble.radius / 3, 
                    bubble.y - bubble.radius / 3, 
                    bubble.radius / 10,
                    bubble.x, 
                    bubble.y, 
                    bubble.radius
                );
                gradient.addColorStop(0, 'white');
                gradient.addColorStop(0.2, bubble.color);
                gradient.addColorStop(1, 'rgba(0,0,0,0)');
                
                ctx.fillStyle = gradient;
                ctx.fill();
                
                // Add a little highlight
                ctx.beginPath();
                ctx.arc(bubble.x - bubble.radius/3, bubble.y - bubble.radius/3, bubble.radius/4, 0, Math.PI*2);
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.fill();
            }
        });
    }

    // 2. Draw Skeleton
    if (results.poseLandmarks) {
        const vWidth = video.videoWidth;
        const vHeight = video.videoHeight;
        const minDim = Math.min(vWidth, vHeight);
        const sx = (vWidth - minDim) / 2;
        const sy = (vHeight - minDim) / 2;

        // Map landmarks function
        const mapLM = (lm) => ({
            x: (lm.x * minDim + sx) / vWidth * canvas.width,
            y: (lm.y * minDim + sy) / vHeight * canvas.height
        });

        const lms = results.poseLandmarks;
        
        // Calculate points
        const head = mapLM(lms[0]); // Nose
        
        const leftHandArr = getCenterOfMass(lms, [15, 17, 19, 21]);
        const rightHandArr = getCenterOfMass(lms, [16, 18, 20, 22]);
        
        const leftHand = leftHandArr ? mapLM(leftHandArr) : null;
        const rightHand = rightHandArr ? mapLM(rightHandArr) : null;

        const lShoulder = mapLM(lms[11]);
        const rShoulder = mapLM(lms[12]);
        const lElbow = mapLM(lms[13]);
        const rElbow = mapLM(lms[14]);
        const lHip = mapLM(lms[23]);
        const rHip = mapLM(lms[24]);
        const lKnee = mapLM(lms[25]);
        const rKnee = mapLM(lms[26]);
        const lAnkle = mapLM(lms[27]);
        const rAnkle = mapLM(lms[28]);

        // Draw Skeleton lines
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00FF00';
        
        drawLine(ctx, lShoulder, rShoulder);
        drawLine(ctx, lShoulder, lHip);
        drawLine(ctx, rShoulder, rHip);
        drawLine(ctx, lHip, rHip);

        drawLine(ctx, lShoulder, lElbow);
        drawLine(ctx, lElbow, leftHand);
        drawLine(ctx, rShoulder, rElbow);
        drawLine(ctx, rElbow, rightHand);

        drawLine(ctx, lHip, lKnee);
        drawLine(ctx, lKnee, lAnkle);
        drawLine(ctx, rHip, rKnee);
        drawLine(ctx, rKnee, rAnkle);

        ctx.shadowColor = '#FF0000';
        drawPoint(ctx, head, '#00FF00', 10);
        drawPoint(ctx, leftHand, '#FF0000', 8);
        drawPoint(ctx, rightHand, '#FF0000', 8);

        [lShoulder, rShoulder, lElbow, rElbow, lHip, rHip, lKnee, rKnee, lAnkle, rAnkle].forEach(p => {
            drawPoint(ctx, p, '#FFFFFF', 4);
        });
    }
    ctx.restore();
}
