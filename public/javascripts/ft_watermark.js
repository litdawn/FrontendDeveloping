class Complex {
    constructor(real, img) {
        this.real = real;
        this.img = img;
    }

    add(another) {
        return new Complex(this.real + another.real, this.img + another.img);
    }

    sub(another) {
        return new Complex(this.real - another.real, this.img - another.img);
    }

    mul(another) {
        let ans_real = this.real * another.real - this.img * another.img;
        let ans_img = this.real * another.img + this.img * another.real;
        return new Complex(ans_real, ans_img);
    }

    get_abs() {
        let ans = (this.real * this.real + this.img * this.img);
        return Math.sqrt(ans);
    }

    set_real(real) {
        this.real = real;
    }

    get_real() {
        return this.real;
    }

    set_img(img) {
        this.img = img;
    }

    get_img() {
        return this.img;
    }
}

function euler(x) {
    return new Complex(Math.cos(x), Math.sin(x));
}

const ori_path = "../ori_img/2.jpg"
// const ori_path = "./test.jpg";
const wm_path = "./wm.jpg";
const ori_max_height = 512;
const ori_max_width = 512;
const fft_without_wm_id="fft-canvas";
const wmed_fft_canvas_id = "fft-canvas1";
const fft_canvas_id = "fft-canvas2";
const wmed_img_canvas_id = "wmed-canvas"


let fft_ori_blue = [];
let img_data;

function read_img_to_fd() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    //将图片加载到canvas中
    let ori_img = new Image();
    ori_img.src = ori_path;

    let blue = Array();
    ori_img.onload = () => {
        canvas.height = ori_img.height;
        canvas.width = ori_img.width;
        console.log(canvas.height)
        console.log(canvas.width)
        ctx.drawImage(ori_img, 0, 0);
        img_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let rgba_mat = img_data.data;
        // 读取蓝色通道矩阵
        for (let i = 0; i < ori_max_height; i++) {
            for (let j = 0; j < ori_max_width; j++) {
                blue.push(rgba_mat[i * img_data.width * 4 + j * 4 + 2]);
            }
        }

        fft_ori_blue = fft(blue);
        draw_complex(fft_ori_blue,fft_without_wm_id);
        get_watermark();
    }
}

let water_mark = []

function get_watermark() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    let watermark = new Image();
    watermark.src = wm_path;
    watermark.onload = () => {
        canvas.height = watermark.height;
        canvas.width = watermark.width;
        ctx.drawImage(watermark, 0, 0);
        let rgba_wm = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let wm_mat_red = Array();
        for (let i = 0; i < rgba_wm.length / 4; i++) {
            wm_mat_red.push(rgba_wm[i * 4]);
        }
        let wm_mat_loc = Array();
        for (let i = 0; i < canvas.height; i++) {
            for (let j = 0; j < canvas.width; j++) {
                if (wm_mat_red[i * canvas.width + j] < 250) {
                    // 小于250，认为是水印内容的一部分
                    wm_mat_loc.push([i, j]);
                }
            }
        }
        water_mark = wm_mat_loc;
        add_wm();
    }
}


let fft_wmed_blue = []

function add_wm() {
    for (let i = 0; i < water_mark.length; i++) {
        //中心对称地添加水印
        fft_ori_blue[water_mark[i][0] * ori_max_width + water_mark[i][1]] = new Complex(0, 0);
        fft_ori_blue[(ori_max_height - 1 - water_mark[i][0]) * ori_max_width + ori_max_width - 1 - water_mark[i][1]] = new Complex(0, 0);
    }

    fft_wmed_blue = fft_ori_blue

    draw_wmed(fft_wmed_blue);

}

function draw_wmed(fft_wmed_blue) {

    let wmed_img_blue = ifft(fft_wmed_blue);
    const canvas = document.getElementById("wmed-canvas");
    const ctx = canvas.getContext("2d");
    let new_data = ctx.createImageData(img_data.width, img_data.height);
    new_data.width = img_data.width;
    new_data.height = img_data.height;
    for (let i = 0; i < img_data.data.length; i++) {
        new_data.data[i] = img_data.data[i];
    }
    for (let i = 0; i < ori_max_height; i++) {
        for (let j = 0; j < ori_max_width; j++) {
            img_data.data[i * 4 * img_data.width + j * 4 + 2] = wmed_img_blue[i * ori_max_width + j];
        }
    }
    ctx.putImageData(new_data, 0, 0);
    draw_complex(fft_wmed_blue, fft_canvas_id);
    draw_complex(fft(wmed_img_blue), wmed_fft_canvas_id);
}

function draw_complex(complex_blue, id) {
    const canvas = document.getElementById(id);
    const ctx = canvas.getContext("2d");
    let new_data = ctx.createImageData(ori_max_width, ori_max_height);
    new_data.width = ori_max_width;
    new_data.height = ori_max_height;
    for (let i = 0; i < complex_blue.length; i++) {
        new_data.data[i * 4] = complex_blue[i].get_abs();
        new_data.data[i * 4 + 1] = complex_blue[i].get_abs();
        new_data.data[i * 4 + 2] = complex_blue[i].get_abs();
        new_data.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(new_data, 0, 0);
}

function fft(array) {

    let length = array.length;

    let complex_array = Array();
    for (let i = 0; i < length; i++) {
        complex_array.push(new Complex(array[i], 0));
    }
    return fft_recursion(complex_array, -1);
}

function ifft(complex_array) {
    let len = complex_array.length;
    let result = fft_recursion(complex_array, 1);
    let array = Array();
    for (let i = 0; i < len; i++) {
        array.push(result[i].get_real() / len);
    }
    return array;
}


function fft_recursion(complex_array, minus) {
    let length = complex_array.length;
    if (length === 2) {
        //F(0)=f(0)+f(1),F(1)=f(0)-f(1)
        return [complex_array[0].add(complex_array[1]), complex_array[0].sub(complex_array[1])];
    } else if (length === 1) {
        return complex_array;
    }
    let middle = length / 2;

    let a = Array();//a(x)=f(2x)
    let b = Array();//b(x)=f(2x+1)
    for (let i = 0; i < middle; i++) {
        a.push(complex_array[2 * i]);
        b.push(complex_array[2 * i + 1]);
    }
    //
    let complexes_a = fft_recursion(a, minus);//计算G(k)
    let complexes_b = fft_recursion(b, minus);//计算P(k)
    let result = Array();//F(k)
    let flag = minus * 2 * Math.PI / length;//2Pi*k/N
    for (let i = 0; i < middle; i++) {
        //e^(2Pi*k/N)
        let complex = euler(flag * i).mul(complexes_b[i]);
        //F(k)=G(k)+(e^(2Pi*k/N))*P(k)
        result[i] = complexes_a[i].add(complex);
        //F(k+(N/2))=G(k)+(e^(2Pi*(k+(N/2))/N))*P(k+(N/2))
        result[i + middle] = complexes_a[i].sub(complex);
    }
    return result;
}

read_img_to_fd()

