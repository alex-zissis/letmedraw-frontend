let points = [];

const saves = [];

function save() {
    saves.push(points);
}

function load() {
    saves[saves.length - 1];
}

function clear() {
    console.log('clear')
    points = [];
}

const strokeStyle = 'black';
const lineCap = 'black';
const lineJoin = 'black';

let id;

window.onload = () => {
    const socket = io.connect('http://52.72.59.187:3000');
    socket.on('welcome', function (data) {
        console.log(data);
        id = data.id;
    });

    socket.on('remoteDraw', function (data) {
        if (data.id !== id) {
            points.push(data);
            draw(data);
        }
    });

    socket.on('remoteStart', function (data) {
        if (data.id !== id) {
            points.push(data);
            start(data);
        }
    });

    socket.on('remoteEnd', function (data) {
        if (data.id !== id) {
            points.push(data);
            end(data);
        }
    });

    const canvas = document.querySelectorAll('canvas')[0];
    const context = canvas.getContext('2d');
    let lineWidth = 0;
    let isMousedown = false;
    canvas.width = window.innerWidth * 2;
    canvas.height = window.innerHeight * 2;

    const draw = data => {
        const userPoints = points.filter(x => x.id === data.id);
        context.strokeStyle = strokeStyle;
        context.lineCap = lineCap;
        context.lineJoin = lineJoin;

        if (userPoints.length >= 3) {
            var l = userPoints.length - 1;
            var xc = (userPoints[l].x + userPoints[l - 1].x) / 2;
            var yc = (userPoints[l].y + userPoints[l - 1].y) / 2;
            context.lineWidth = userPoints[l].lineWidth;
            context.moveTo(userPoints[l - 2].x, userPoints[l - 2].y);
            context.quadraticCurveTo(userPoints[l - 1].x, userPoints[l - 1].y, xc, yc);
            context.stroke();
            context.beginPath();
            context.moveTo(xc, yc);
        }
    };

    const start = data => {
        const x = data.x;
        const y = data.y;
        isMousedown = true;
        context.lineWidth = data.lineWidth;
        context.strokeStyle = 'black';
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.beginPath();
        context.moveTo(x, y);
    }

    const end = data => {
        const userPoints = points.filter(x => x.id === data.id);
        const x = data.x;
        const y = data.y;
        isMousedown = false;
        context.lineWidth = data.lineWidth;
        context.strokeStyle = 'black';
        context.lineCap = 'round';
        context.lineJoin = 'round';
        if (userPoints.length >= 3) {
            const l = userPoints.length - 1;
            context.quadraticCurveTo(userPoints[l].x, userPoints[l].y, x, y);
            context.stroke();
        }
        points = [];
        lineWidth = 0;
    }

    ['touchstart', 'mousedown'].forEach(ev => {
        canvas.addEventListener(ev, e => {
            let pressure = 0.1;
            let x, y;
            if (e.touches && e.touches[0] && typeof e.touches[0]["force"] !== "undefined") {
                if (e.touches[0]["force"] > 0) {
                    pressure = e.touches[0]["force"];
                }
                x = e.touches[0].pageX * 2;
                y = e.touches[0].pageY * 2;
            } else {
                pressure = 1.0;
                x = e.pageX * 2;
                y = e.pageY * 2;
            }
            points.push({
                x, y, lineWidth, id
            });
            start({ x, y, lineWidth, id });
            socket.emit('start', { x, y, lineWidth, id });
        });
    });

    ['touchmove', 'mousemove'].forEach(ev => {
        canvas.addEventListener(ev, e => {
            if (ev === 'mousemove') if (!isMousedown) return;
            let pressure = 0.1;
            let x, y;
            if (e.touches && e.touches[0] && typeof e.touches[0]["force"] !== "undefined") {
                if (e.touches[0]["force"] > 0) {
                    pressure = e.touches[0]["force"];
                }
                x = e.touches[0].pageX * 2;
                y = e.touches[0].pageY * 2;
            } else {
                pressure = 1.0;
                x = e.pageX * 2;
                y = e.pageY * 2;
            }
            lineWidth = (Math.log(pressure + 1) * 40 * 0.4 + lineWidth * 0.6);
            points.push({
                x, y, lineWidth, id
            });
            draw({ x, y, lineWidth, id });
            socket.emit('draw', { x, y, lineWidth, id });
            e.preventDefault();
        })
    });

    ['touchend', 'touchleave', 'mouseup'].forEach(ev => {
        canvas.addEventListener(ev, e => {
            let pressure = 0.1;
            let x, y;
            if (e.touches && e.touches[0] && typeof e.touches[0]["force"] !== "undefined") {
                if (e.touches[0]["force"] > 0) {
                    pressure = e.touches[0]["force"];
                }
                x = e.touches[0].pageX * 2;
                y = e.touches[0].pageY * 2;
            } else {
                pressure = 1.0;
                x = e.pageX * 2;
                y = e.pageY * 2;
            }
            points.push({
                x, y, lineWidth, id
            });
            end({ x, y, lineWidth, id });
            socket.emit('end', { x, y, lineWidth, id });
        });
    });
}

