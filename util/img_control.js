const tf = require("@tensorflow/tfjs");
const tfn = require("@tensorflow/tfjs-node");
const fs = require("fs")

const layers_name = [
    'block1_conv1', 'block1_conv2', 'block1_pool',
    'block2_conv1', 'block1_conv2', 'block2_pool',
    'block3_conv1', 'block3_conv2', 'block3_conv3', 'block3_pool',
    'block4_conv1', 'block4_conv2', 'block4_conv3', 'block4_pool',
    'block5_conv1', 'block5_conv2', 'block5_conv3', 'block5_pool',
]

const layer_config = {
    'content': {
        data: ['block4_conv1'],
        num: 1
    },
    'style': {
        data: ['block1_conv1', 'block2_conv1', 'block3_conv1'],
        num: 3
    }
}
const learning_rate = 0.9;
const noise = tf.scalar(0.5);
const weight_config = {
    style_weight: [0.3, 0.3, 0.3],
    content_weight: [1000],
}

const epoch = 100;


let size;
let style_trans_model;
let target;
let style_img;
let content_img;
let img;

class StyleTrans {
    constructor(model) {
        this.model = model;
        this.block1_conv1 = this.get_args('block1_conv1');
        this.block1_conv2 = this.get_args('block1_conv2');
        this.block2_conv1 = this.get_args('block2_conv1');
        this.block2_conv2 = this.get_args('block2_conv2');
        this.block3_conv1 = this.get_args('block3_conv1');

    }

    async extract(input) {
        let block1_conv1 = this.conv_and_relu(input, this.block1_conv1);
        let block1_conv2 = this.conv_and_relu(block1_conv1, this.block1_conv2);
        let block1_pool = this.max_pool(block1_conv2);
        let block2_conv1= this.conv_and_relu(block1_pool, this.block2_conv1);
        let block2_conv2 = this.conv_and_relu(block2_conv1, this.block2_conv2);
        let block2_pool = this.max_pool(block2_conv2);
        let block3_conv1 = this.conv_and_relu(block2_pool, this.block3_conv1);
        this.output = {
            content: [block1_conv1],
            style: [block1_conv1, block2_conv1, block3_conv1]
        }
        return this.output;

    }

    conv_and_relu(input, w_b) {
        return tf.tidy(() => {
            let conv = tf.conv2d(input, w_b.kernel, [1, 1], 'same');
            return tf.relu(tf.add(conv, w_b.bias));
        })
    }

    max_pool(input) {
        return tf.maxPool(input, [2, 2], [2, 2], 'same');
    }

    get_args(layer_name) {
        const kernel = this.model.getLayer(layer_name)['kernel'].val
        const bias = this.model.getLayer(layer_name)['bias'].val
        kernel.trainable = false
        bias.trainable = false
        return {
            kernel: kernel,
            bias: bias
        }
    }

}




async function load_model(req, res) {
    // 提供风格的图片的大小

    let two = reload_img(req.body);

    style_img = two.style;
    content_img = two.content;

    // 导入VGG16预训练模型
    let handler = tfn.io.fileSystem("./tfjs/model/model.json");
    let vgg16_model = await tf.loadLayersModel(handler)


    // 建立风格转换模型
    style_trans_model = new StyleTrans(vgg16_model);

    target = []
    target['style'] = (await style_trans_model.extract(style_img)).style;
    target['content'] = (await style_trans_model.extract(content_img)).content;


    //初始化输入
    img = get_random_img(content_img);

    //开始训练
    await train()


    //获得结果
    let result = await depreprocess(img, tf.scalar(128.0)).array();
    res.send({
        data: result[0]
    })


}

function get_random_img(content_img) {
    return tf.tidy(() => {
            const noise_image = tf.randomUniform(content_img.shape, -20, 20, 'float32')
            const random_image = tf.mul(noise_image, noise).add(tf.mul(content_img, tf.sub(tf.scalar(1), noise)))
            return tf.variable(random_image, true)
        }
    )
}

function reload_img(body) {
    let content_path = './public'+body.content_img;
    let style_path = './public'+body.style_img;
    size =  body.size;

    let style_tmp = new Uint8Array(Buffer.from(fs.readFileSync(style_path)));
    let content_tmp = new Uint8Array(Buffer.from(fs.readFileSync(content_path)));

    let style_img_data = tfn.node.decodeImage(style_tmp, 3);
    let content_img_data = tfn.node.decodeImage(content_tmp, 3);

    style_img_data = tf.image.resizeBilinear(style_img_data, [size, size])
    content_img_data = tf.image.resizeBilinear(content_img_data,[size,size])

    style_img_data = preprocess(style_img_data, tf.scalar(128.0));
    content_img_data = preprocess(content_img_data, tf.scalar(128.0));

    return {
        style : style_img_data,
        content: content_img_data
    };
}


async function train() {
    const optimizer = tf.train.adam(learning_rate)
    for (let i = 0; i < epoch; i++) {
        console.log("epoch : "+i+" in "+epoch)
        optimizer.minimize(
            () => {
                return loss()
            }
        )
    }

}

function gram(input_tensor) {
    let shape = input_tensor.shape;
    let feature = tf.reshape(input_tensor, [shape[0], shape[1] * shape[2], shape[3]]);
    let gram = tf.matMul(feature, feature, true, false);
    return gram.div(tf.scalar(size * size));
}

function loss() {
    return tf.tidy(() => {

        style_trans_model.extract(img)

        let style_loss = tf.scalar(0.0);
        let content_loss = tf.scalar(0.0);

        let style_output = style_trans_model.output.style;
        let content_output = style_trans_model.output.content;

        //风格损失
        for (let i = 0; i < layer_config.style.num; i++) {
            style_loss = tf.tidy(()=>{
                const pure = tf.mean(gram(style_output[i]).squaredDifference(gram(target.style[i])));
                const shape = style_output[i].shape;
                const this_loss = pure.mul(tf.scalar(weight_config.style_weight[i])).div(tf.scalar(shape[1]*shape[2]*shape[3]));

                return style_loss.add(this_loss)
            })
        }
        style_loss.print()
        //内容损失
        for(let i=0;i<layer_config.content.num;i++){
            content_loss = tf.tidy(()=>{
                const pure = tf.mean(content_output[i].squaredDifference(target.content[i]));
                const shape = content_output[i].shape;
                const this_loss = pure.mul(tf.scalar(weight_config.content_weight[i])).div(tf.scalar(shape[1]*shape[2]*shape[3]));
                return content_loss.add(this_loss);
            })
        }
        content_loss.print();

        return style_loss.add(content_loss);
    })
}


function preprocess(image, mean) {
    return image.expandDims(0).toFloat().sub(mean);
}

function depreprocess(image, mean) {
    return image.add(mean);
}

module.exports = {
    load_model
}


