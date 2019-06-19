!(function(win, $, undefined) {
    let arr = [];

    // 多级联动
    $.fn.extend({
        cascader: function(option) {
            if (this.length >= 1) {
                let ele = this[0];
                if (arr.indexOf(ele) === -1) {
                    arr.push(ele);
                    return new Cascader(ele, option);
                }
            }
        }
    });

    // 默认配置
    let _defaultOption = {
        crtLevel: 0,
        maxLevel: 3,
        defaultData: [],
        defaultValue: [],
        hasSearchLevel: [2, 3],
        success: function() {},
        getData: function() {},
        isScroll: false
    };

    // 级联
    function Cascader(ele, option) {
        this.id = "cascader" + util.getRandom();
        this.ele = ele;
        this.option = $.extend({}, _defaultOption, option);
        this.data = util.getFormatData(this.option.defaultData);
        this.defaultValue = this.option.defaultValue;
        this.result = [];
        this.init();
    }

    // 初始化
    Cascader.prototype.init = function() {
        this.setLayout();
        this.bindEvent();
        this.initDefaultValue();
    };

    // 初始化默认值
    Cascader.prototype.initDefaultValue = function() {
        if (this.defaultValue.length === 0) {
            this.getData(0);
        } else {
            this.getDataByDefaultValue();
        }
    };

    $.extend(Cascader.prototype, {
        // 获取默认数据
        getDataByDefaultValue() {
            let obj = {};
            let _this = this;
            this.loadDataByDefaultValue(0, obj, function(data) {
                _this.data = $.extend({}, _this.data, data);
                _this.initRender();
            });
        },
        // 加载默认数据
        loadDataByDefaultValue(level, obj, callback) {
            if (this.defaultValue.length >= level && level <= this.option.maxLevel) {
                let crtValue = this.defaultValue[level - 1] || { key: "", value: "" };
                let key = level.toString() + crtValue.key + crtValue.value;
                let data = this.data[key];
                if (data) {
                    obj[key] = data;
                    this.loadDataByDefaultValue(level + 1, obj, callback);
                } else {
                    this.option.getData.call(
                        this,
                        { key: crtValue.key, value: crtValue.value },
                        function(res) {
                            obj[key] = res;
                            this.loadDataByDefaultValue(level + 1, obj, callback);
                        }.bind(this)
                    );
                }
            } else {
                callback(obj);
            }
        },
        // 初始化渲染
        initRender() {
            this.defaultValue.forEach((item, index) => {
                this.option.crtLevel = index;
                let params = this.defaultValue[index - 1] || { key: "", value: "" };
                let key = this.option.crtLevel.toString() + params.key + params.value;
                this.setBodyLayout(item);
                this.setBodyLayoutContentByData(this.data[key], item);
            });

            if (this.option.crtLevel < this.option.maxLevel) {
                this.option.crtLevel++;
                let params = this.defaultValue[index - 1] || { key: "", value: "" };
                let key = this.option.crtLevel.toString() + params.key + params.value;
                this.setBodyLayout();
                this.setBodyLayoutContentByData(this.data[key], item);
            }

            this.result = this.defaultValue;
        }
    });

    $.extend(Cascader.prototype, {
        // 获取最外层的盒子
        getBox() {
            return $(`#${this.id}`);
        },
        // 获取遮罩层
        getBoxShade() {
            return $(`#${this.id}_shade`);
        },
        // 获取取消按钮
        getBoxBtnCancel() {
            return this.getBox().find(".cascader-btns .cascaderCancel");
        },
        // 获取确认按钮
        getBoxBtnOK() {
            return this.getBox().find(".cascader-btns .cascaderOK");
        },
        // 获取最后一层的内容框
        getLastItem() {
            return this.getBox()
                .find(".cascader-body")
                .last()
                .find(".cascader-body-content");
        }
    });

    $.extend(Cascader.prototype, {
        // 设置主体布局
        setLayout() {
            let result = [];
            result.push(`<div id="${this.id}" class="cascader-box">`);
            result.push(`<div class="cascader-btns">`);
            result.push(`<button class="c-btn c-btn-default c-btn-mini cascaderCancel">取消</button>`);
            result.push(`<button class="c-btn c-btn-default c-btn-mini c-btn-primary cascaderOK">确认</button>`);
            result.push(`</div>`);
            result.push(`</div>`);
            result.push(`<div id="${this.id}_shade" class="cascader-box-shade"></div>`);
            $("body").append(result.join(""));
        },
        // 设置层级下拉列表
        setBodyLayout(obj = { key: "", value: "" }) {
            let result = [];
            let level = this.option.crtLevel;
            let header = this.isHasSearchLevel() ? this.getBodyLayoutHeader() : "";
            let body = this.getBodyLayoutContent();
            result.push(`<div class="cascader-body" data-level="${level}" data-key="${obj.key}" data-value="${obj.value}">`);
            result.push(header);
            result.push(body);
            result.push(`</div>`);
            // 先清除
            this.clearBodyLayoutByLevel(level);
            // 再追加
            this.getBox().append(result.join(""));
        },
        // 清除指定层级之后的元素，包括当前层级
        clearBodyLayoutByLevel(level) {
            this.getBox()
                .find(".cascader-body")
                .each(function(idx) {
                    if (idx >= level) {
                        $(this).remove();
                    }
                });
        },
        // 获取层级下拉列表头部
        getBodyLayoutHeader() {
            let result = [];
            result.push(`<div class="cascader-body-header">`);
            result.push(`<input type="text"/>`);
            result.push(`</div>`);
            return result.join("");
        },
        // 获取层级下拉列表内容主体
        getBodyLayoutContent() {
            let result = [];
            let className = "cascader-body-content" + (this.isHasSearchLevel() ? " v2" : "");
            result.push(`<ul class="${className}">`);
            result.push(`<li class="cascader-item-loading"><span>加载中...</span></li>`);
            result.push(`</ul>`);
            return result.join("");
        },
        // 设置层级下拉列表内容
        setBodyLayoutContentByData(data, crtData = { key: "", value: "" }) {
            let result = [];
            let moreClass = this.option.crtLevel === this.option.maxLevel ? "" : " more-icon";
            data.forEach(item => {
                result.push(
                    `<li class="cascader-item${moreClass}${item.key === crtData.key ? " active" : ""}" data-key="${item.key}" data-value="${
                        item.value
                    }"><span>${item.value}</span></li>`
                );
            });
            this.getLastItem().html(result.join(""));
        },
        // 是否有查询框的层级
        isHasSearchLevel() {
            return this.option.hasSearchLevel.indexOf(this.option.crtLevel) > -1;
        }
    });

    $.extend(Cascader.prototype, {
        // 获取数据
        getData(level, isAppend = true) {
            this.option.crtLevel = level;
            this.unBindEvent();
            if (isAppend) {
                this.setBodyLayout();
            } else {
                this.clearBodyLayoutByLevel(level + 1);
            }

            let params = this.getParamsByIndex(level - 1);
            let key = this.getDataKey();
            let data = this.data[key];
            if (data) {
                this.getDataCallback(data);
            } else {
                this.option.getData.call(this, params, this.getDataCallback.bind(this));
            }
        },
        // 获取数据回调
        getDataCallback(data) {
            let key = this.getDataKey();
            this.data[key] = data;
            this.setBodyLayoutContentByData(data);
            this.bindEvent();
        },
        // 获取参数
        getParamsByIndex(index) {
            let ele = this.getBox()
                .find(".cascader-body")
                .eq(index);
            return {
                key: ele.data("key") || "",
                value: ele.data("value") || "",
                content: $.trim(
                    ele
                        .next()
                        .find(".cascader-body-header input")
                        .val() || ""
                )
            };
        },
        // 获取当前data key
        getDataKey() {
            let params = this.getParamsByIndex(this.option.crtLevel - 1);
            return this.option.crtLevel.toString() + params.key + params.value + params.content;
        },
        // 获取结果
        getResult() {
            let keys = [];
            let values = [];
            let data = [];
            // this.getBox()
            //     .find(".cascader-body")
            //     .each(function() {
            //         let key = $(this).data("key");
            //         let value = $(this).data("value");
            //         keys.push(key);
            //         values.push(value);
            //         data.push({ key: key, value: value });
            //     });

            this.result.forEach(item => {
                keys.push(item.key);
                values.push(item.value);
                data.push(item);
            });

            return { keys, values, data };
        },
        // 获取key
        getKeyByParentPrev(parent) {
            let prev = parent.prev(".cascader-body");
            if (prev.length <= 0) {
                return "0";
            } else {
                return (parseInt(prev.data("level")) + 1).toString() + prev.data("key") + prev.data("value");
            }
        },
        // 设置结果
        setResult(level, data) {
            this.result[level] = data;
            this.result.length = level + 1;
        }
    });

    $.extend(Cascader.prototype, {
        // 解绑事件
        unBindEvent() {
            this.getBox().off("click");
        },
        // 绑定事件
        bindEvent() {
            let _this = this;
            let timer = null;

            // 每一项
            this.getBox()
                .off("click")
                .on("click", ".cascader-item", function() {
                    let parent = $(this).closest(".cascader-body");
                    let level = parent.data("level") * 1;
                    parent.data("key", $(this).data("key"));
                    parent.data("value", $(this).data("value"));
                    let key = _this.getKeyByParentPrev(parent);
                    _this.setResult(level, _this.data[key][$(this).index()]);

                    $(this)
                        .addClass("active")
                        .siblings()
                        .removeClass("active");

                    if (_this.option.maxLevel === level) {
                        let res = _this.getResult();
                        _this.option.success.call(_this, res.keys, res.values, res.data);
                        _this.hide();
                    } else {
                        _this.getData(level + 1);
                    }
                });

            // 输入框
            this.getBox()
                .off("keyup")
                .on("keyup", "input", function() {
                    clearTimeout(timer);
                    timer = setTimeout(() => {
                        let parent = $(this).closest(".cascader-body");
                        let index = parent.data("level") * 1;
                        _this.getData(index, false);
                    }, 300);
                });

            // 绑定的元素
            $(this.ele)
                .unbind("click")
                .bind("click", function() {
                    _this.show();
                });

            // 遮罩点击
            this.getBoxShade()
                .unbind("click")
                .bind("click", function() {
                    _this.hide();
                });

            this.getBoxBtnCancel()
                .unbind("click")
                .bind("click", function() {
                    _this.hide();
                });

            this.getBoxBtnOK()
                .unbind("click")
                .bind("click", function() {
                    let res = _this.getResult();
                    _this.option.success.call(_this, res.keys, res.values, res.data);
                    _this.hide();
                });
        }
    });

    // 展示
    Cascader.prototype.show = function() {
        let zIndex = util.getMaxZIndex();
        let offsetLeft = this.ele.offsetLeft;
        let offsetTop = this.ele.offsetTop + this.ele.offsetHeight + 5;
        this.getBox().css({
            display: "block",
            zIndex: zIndex + 100,
            left: offsetLeft,
            top: offsetTop
        });

        this.getBoxShade().css({
            display: "block",
            zIndex: zIndex + 99
        });
        this.scrollFixedPosition();
    };

    // 隐藏
    Cascader.prototype.hide = function() {
        this.getBox().hide();
        this.getBoxShade().hide();
    };

    // 滚动至指定位置
    Cascader.prototype.scrollFixedPosition = function() {
        let _this = this;
        if (!this.option.isScroll) {
            this.option.isScroll = true;
            this.getBox()
                .find(".cascader-item.active")
                .each(function() {
                    _this.scrollFixedPositionByElement(this);
                });
        }
    };

    // 滚动至指定位置
    Cascader.prototype.scrollFixedPositionByElement = function(ele, isAnimate = false) {
        let $this = $(ele);
        let scrollNum = 3;
        let index = $this.index();
        let scrollHeight = $this[0].scrollHeight;
        let scrollTop = scrollHeight * index - scrollHeight * scrollNum;

        $this.parent().animate(
            {
                scrollTop: scrollTop
            },
            isAnimate ? 300 : 0
        );
    };

    // 工具助手
    let util = {
        getMaxZIndex() {
            let max = Math.max.apply(
                null,
                $.map($("body *"), function(ele, index) {
                    if ($(ele).css("position") != "static") {
                        return parseInt($(ele).css("z-index")) || 1;
                    } else {
                        return -1;
                    }
                })
            );
            return max;
        },
        getRandom() {
            return Math.random()
                .toString()
                .slice(2, 12);
        },
        getFormatData(data) {
            let result = {};
            this.formatData(data, result, 0, parent);
            return result;
        },
        formatData(data, result, level, parent) {
            if (data.length > 0) {
                result[level.toString() + (parent.key || "") + (parent.value || "")] = data;
                data.forEach(item => {
                    if (item.children) {
                        util.formatData(item.children, result, level + 1, item);
                    }
                });
            }
        }
    };
})(window, jQuery);
