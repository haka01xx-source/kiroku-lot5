/**
 * 暗記スクリーン
 *
 * 暗記用画面。下の暗記キャンバスはここで使用。
 */
$(function() {

    // Web Speech API
    try {
        if ('speechSynthesis' in window) {
            getSpeechVoices();
            window.speechSynthesis.onvoiceschanged = () => {
                getSpeechVoices();
            };
        } else {
            $('.anki_screen_setting.read_aloud_voice_front').html('<option value="auto">対応していません</option>');
            $('.anki_screen_setting.read_aloud_voice_back').html('<option value="auto">対応していません</option>');
        }
    } catch (e) {
        console.log('Speech synthesis error.');
    }

    // イベント登録
    let activeIndex, animationIndex, animationType, cardCount, autoFlip, autoFlipPauce, inPause, imageExp, loopCount;
    activeIndex = 0;
    $(document).on('click', 'button.anki_screen_setting.init', function() {
        $('#learning_panel').addClass('active');
        initAnkiScreen();
    });
    $(document).on('click', 'button.anki_screen_setting.pauce', function() {
        $('#learning_panel').removeClass('active');
        pauseAnkiScreen();
    });
    $(document).on('click', 'button.anki_screen_setting.stop', function() {
        $('#learning_panel').removeClass('active');
        loopCount = 0;
        stopAnkiScreen();
    });
    $(document).on('change', 'input.anki_screen_setting.shuffle', function() {
        if (inPause && confirm('変更すると1枚目からになりますがよろしいですか。')) {
            stopAnkiScreen();
            inPause = false;
        }
        if (!$(this).prop('checked')) {
            shuffleBackCard();
        }
    });
    $(document).on('click', 'input.anki_screen_setting.reverse', function() {
        if ($(this).prop('checked')) {
            reverseCard();
        } else {
            reverseBackCard();
        }
    });
    $(document).on('click', 'button.anki_screen_setting.canvas_change', function() {
        $('button.anki_screen_setting.canvas_typing').html('<i class="fas fa-hand-paper"></i>フリー');
        $('#canvas_textarea').css('pointer-events', 'none');
        if (brush['type'] == 'pencil') {
            $(this).html('<i class="fas fa-eraser"></i>消しゴム');
            brush = { type: "eraser", size: 30, color: '#444' };
        } else {
            $(this).html('<i class="fas fa-pen-nib"></i>ペン');
            brush = { type: "pencil", size: 3, color: '#444' };
        }
    });
    $(document).on('click', 'button.anki_screen_setting.canvas_typing', function() {
        if ($('#canvas_textarea').css('pointer-events') == 'none') {
            $(this).html('<i class="fas fa-keyboard"></i>テキスト');
            $('#canvas_textarea').css('pointer-events', 'all');
        } else {
            $(this).html('<i class="fas fa-hand-paper"></i>フリー');
            $('#canvas_textarea').css('pointer-events', 'none');
        }
    });
    $(document).on('click', 'button.anki_screen_setting.canvas_reset', function() {
        $('#canvas_textarea').val('');
        dcvx.clearRect(0, 0, dcv.width, dcv.height);
    });
    $(document).on('click', 'button.anki_screen_setting.restart', function(event) {
        event.stopPropagation();
        event.preventDefault();
        stopAnkiScreen(true);
        initAnkiScreen(true);
    });
    $(document).on('click', 'button.anki_screen_setting.image_exp', function() {
        imageExpansion();
    });
    $(document).on('click', 'button.anki_screen_setting.image_disexp', function() {
        imageExpansionDisable();
    });
    $(document).on('click', '#anki_screen .control label.check_box input', function() {
        checkCard();
    });
    $(document).on('click', 'input.anki_screen_setting.auto_flip', function() {
        if ($(this).prop('checked')) {
            $('.auto_time').show();
        } else {
            $('.auto_time').hide();
        }
    });
    $(document).on('click', 'button.anki_screen_setting.auto_flip_control', function() {
        /*
        if (autoFlip) {
            $(this).html('<i class="fas fa-play"></i>');
            clearInterval(autoFlip);
            autoFlip = null;
        } else {
            $(this).html('<i class="fas fa-pause"></i>');
            const chengeTime = Number($("input.anki_screen_setting.auto_flip_time").val()) * 1000;
            if (chengeTime > 0) {
                autoFlip = setInterval(function() {
                    nextCard();
                }, chengeTime);
            } else {
                // 音声
                if ($('input.anki_screen_setting.read_aloud').prop('checked')) {
                    autoFlip = setInterval(function() {
                        if (!speechSynthesis.speaking) {
                            nextCard();
                        }
                    }, 300);
                }
            }
        }
        */
        if (autoFlip) {
            autoFlipPauce = true;
            $(this).html('<i class="fas fa-play"></i>');
            clearAutoFlip();
        } else {
            $(this).html('<i class="fas fa-pause"></i>');
            setAutoFlip();
        }
    });
    $(document).on('click', 'button.anki_screen_setting.read_aloud_btn', function() {
        let readType = $('select.anki_screen_setting.read_aloud_type').val();
        let speechCard;
        if (readType == 'front') {
            speechCard = getCard(activeIndex % 2 ? activeIndex - 1 : activeIndex);
        } else if (readType == 'back') {
            speechCard = getCard(activeIndex % 2 ? activeIndex : activeIndex + 1);
        } else if (readType == 'reverse') {
            speechCard = getCard(activeIndex % 2 ? activeIndex - 1 : activeIndex + 1);
        } else {
            speechCard = getCard(activeIndex);
        }
        let speechTextElem = $('<span></span>').html(speechCard.find('.text').html());
        speechTextElem.find('.silent').html('.');

        speechText(speechTextElem.text(), speechCard.find('.language').val(), $('.anki_screen_setting.read_aloud_voice_' + (activeIndex%2 ? 'back' : 'front')).val());
    });
    $(document).on('click', 'input.anki_screen_setting.read_aloud', function() {
        if ($(this).prop('checked')) {
            $('.read_aloud_item').show();
        } else {
            $('.read_aloud_item').hide();
            $('select.anki_screen_setting.read_aloud_type').val('normal');
            $('select.anki_screen_setting.read_aloud_voice_front').val('auto');
            $('select.anki_screen_setting.read_aloud_voice_back').val('auto');
        }
    });
    $(document).on('click', 'input.anki_screen_setting.text_style', function() {
        if ($(this).prop('checked')) {
            $('.text_style_item').show();
        } else {
            $('.text_style_item').hide();
        }
    });
    var fontSizeReset = false;
    $(document).on('change', 'input.anki_screen_setting.text_style_size', function() {
        let regexpNum = new RegExp(/^[0-9]+(\.[0-9]+)?$/);
        let textSize = $(this).val();
        if (regexpNum.test(parseInt(textSize))) {
            $(this).val(parseInt(textSize));
        } else {
            if (textSize != 'auto') {
                $(this).val('auto');
            }
        }
    });
    $(document).on('click', 'input.anki_screen_setting.hide_checked', function() {
        inPause = false;
    });
    $(document).on('inview', 'button.anki_screen_setting.init.fix', function(event, isInView, visiblePartX, visiblePartY) {
        if (isInView) {
            $('.anki_fixed_btn').fadeOut(1);
        } else {
            $('.anki_fixed_btn').fadeIn(1);
        }
    });
    $(document).on('click', 'a.anki_screen_setting.edit_card', function() {
        let cardIdEdit = activeIndex ? '&hl='+Math.floor(activeIndex/2) : '';
        location.href = 'https://ankilot.com/edit/?id='+getParam('id')+cardIdEdit;
    });

    // ヒント隠しを削除
    $(document).on('click', '#anki_screen .card .hint.hide', function(e) {
        e.stopPropagation();
        $(this).removeClass('hide');
    });

    let progressActive = false;
    $('#anki_screen .status .progress_bar').on('mousedown touchstart', function (event) {
        progressActive = true;
        let index = Math.floor(((event.offsetX ? event.offsetX : event.originalEvent.touches[0].pageX - $(this).offset().left) / $(this).width()) * cardCount);
        $(this).attr('title', (Math.floor(index/2)+1)+'枚目の'+((index%2==0?'表':'裏')));
        jumpCard(index);
    });
    $('#anki_screen .status .progress_bar').on('mouseup mouseleave touchend', function (event) {
        progressActive = false;
    });
    $('#anki_screen .status .progress_bar').on('mousemove touchmove', function (event) {
        let index = Math.floor(((event.offsetX ? event.offsetX : event.originalEvent.touches[0].pageX - $(this).offset().left) / $(this).width()) * cardCount);
        $(this).attr('title', (Math.floor(index/2)+1)+'枚目の'+((index%2==0?'表':'裏')));
        if (progressActive) {
            jumpCard(index);
        }
    });

    // タッチ操作関連
    let direction, position;
    $("#anki_screen ul.card_list").on('touchstart', function(event) {
        position = event.originalEvent.touches[0].pageX;
        direction = '';
    });
    $("#anki_screen ul.card_list").on('touchmove', function(event) {
        // 30px以上でスワイプと判断
        if (position - event.originalEvent.touches[0].pageX > 30) {
            direction = 'left';
        } else if (position - event.originalEvent.touches[0].pageX < -30) {
            direction = 'right';
        }
    });
    $("#anki_screen ul.card_list").on('touchend', function(event) {
        if (window.getSelection().toString() == '') {
            if (direction == 'right') {
                prevCard();
            } else if (direction == 'left') {
                nextCard();
            }
        }
    });
    $(document).on('click', "#anki_screen ul.card_list .card .text, #anki_screen ul.card_list .card .hint", function(e) {
        if (window.getSelection().toString() != '') {
            e.stopPropagation();
        }
    });
    $(document).on('click', "#anki_screen ul.card_list", function(e) {
        if ($("input.anki_screen_setting.easy_flip").prop("checked")) {
            window.getSelection().removeAllRanges();
            nextCard();
        }
    });

    // ビュワーの設定を適用
    if ($('input.anki_screen_setting.viewer_config').val()) {
        const viewerConfig = getViewerConfig($('input.anki_screen_setting.viewer_config').val());
        console.log('Loading viewer config.');
        if (viewerConfig['anki_easy_flip']) {
            $('input.anki_screen_setting.easy_flip').click();
        }
        if (viewerConfig['anki_hide_checked']) {
            $('input.anki_screen_setting.hide_checked').click();
        }
        if (viewerConfig['anki_reverse']) {
            $('input.anki_screen_setting.reverse').click();
        }
        if (viewerConfig['anki_shuffle']) {
            $('input.anki_screen_setting.shuffle').click();
        }
        if (viewerConfig['anki_infinite_loop']) {
            $('input.anki_screen_setting.infinite_loop').click();
        }
        if (viewerConfig['anki_memo']) {
            $('input.anki_screen_setting.memo').click();
        }
        if (viewerConfig['anki_disable_shortcut']) {
            $('input.anki_screen_setting.disable_shortcut').click();
        }
        if (viewerConfig['anki_auto_flip']) {
            $('input.anki_screen_setting.auto_flip').click();
            if (viewerConfig['anki_auto_flip_time'] != undefined) {
                $('input.anki_screen_setting.auto_flip_time').val(viewerConfig['anki_auto_flip_time']);
            }
            if (viewerConfig['anki_auto_flip_time2'] != undefined) {
                $('input.anki_screen_setting.auto_flip_time2').val(viewerConfig['anki_auto_flip_time2']);
            } else {
                $('input.anki_screen_setting.auto_flip_time2').val(viewerConfig['anki_auto_flip_time']);
            }
        }
        if (viewerConfig['anki_voice_flip']) {
            $('input.anki_screen_setting.voice_flip').click();
        }
        if (viewerConfig['anki_voice_recognition']) {
            $('input.anki_screen_setting.voice_recognition').click();
        }
        if (viewerConfig['anki_read_aloud']) {
            $('input.anki_screen_setting.read_aloud').click();
            if (viewerConfig['anki_read_aloud_side']) {
                $('select.anki_screen_setting.read_aloud_side').val(viewerConfig['anki_read_aloud_side']);
            }
            if (viewerConfig['anki_read_aloud_type']) {
                $('select.anki_screen_setting.read_aloud_type').val(viewerConfig['anki_read_aloud_type']);
            }
            setTimeout(function() {
                if (viewerConfig['anki_read_aloud_voice_front']) {
                    $('select.anki_screen_setting.read_aloud_voice_front').val(viewerConfig['anki_read_aloud_voice_front']);
                }
                if (viewerConfig['anki_read_aloud_voice_back']) {
                    $('select.anki_screen_setting.read_aloud_voice_back').val(viewerConfig['anki_read_aloud_voice_back']);
                }
            }, 500);
        }
        if (viewerConfig['anki_text_style']) {
            $('input.anki_screen_setting.text_style').click();
            if (viewerConfig['anki_text_style_color']) {
                $('select.anki_screen_setting.text_style_color').val(viewerConfig['anki_text_style_color']);
            }
            if (viewerConfig['anki_text_style_weight']) {
                $('select.anki_screen_setting.text_style_weight').val(viewerConfig['anki_text_style_weight']);
            }
            if (viewerConfig['anki_text_style_size']) {
                $('.anki_screen_setting.text_style_size').val(viewerConfig['anki_text_style_size']);
            }
            if (viewerConfig['anki_text_style_position']) {
                $('select.anki_screen_setting.text_style_position').val(viewerConfig['anki_text_style_position']);
            }
            if (viewerConfig['anki_text_style_hint']) {
                $('select.anki_screen_setting.text_style_hint').val(viewerConfig['anki_text_style_hint']);
            }
            if (viewerConfig['anki_text_style_animation']) {
                $('select.anki_screen_setting.text_style_animation').val(viewerConfig['anki_text_style_animation']);
            }
        }
    }

    // PCならタッチでめくるをオン
    if ($('input.anki_screen_setting.easy_flip').length) {
        const ua = navigator.userAgent;
        const elem = $('input.anki_screen_setting.easy_flip');
        if (!((ua.indexOf('iPhone') > 0 || ua.indexOf('Android') > 0 && ua.indexOf('Mobile') > 0 || ua.indexOf('iPad') > 0 || ua.indexOf('Android') > 0) || ua.indexOf('iPad') > 0 || ua.indexOf('Android') > 0)) {
            elem.prop('checked', true);
        }
    }

    /**
     * 暗記スクリーンを初期化
     */
    function initAnkiScreen(restart = false) {

        console.log('Initializing anki screen.');

        if ($('input.anki_screen_setting.disable_shortcut').prop('checked')) {
            document.activeElement.blur();
            document.onkeydown = null;
        } else {
            // キーバインド
            document.onkeydown = function(e) {
                if (e.key === 'Enter' | e.key === ' ' | e.key === 'ArrowRight') {
                    e.preventDefault();
                    nextCard();
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    prevCard();
                } else if (e.key === 'c') {
                    if (e.ctrlKey) {
                        if (window.getSelection().toString() == '') {
                            e.preventDefault();
                            sendClipboard(getCard(activeIndex).find('.text').text(), false);
                        }
                    } else {
                        e.preventDefault();
                        $('#anki_screen .control label.check_box input').click();
                    }
                } else if (e.key === 'p') {
                    if ($('input.anki_screen_setting.auto_flip').prop('checked')) {
                        $('button.anki_screen_setting.auto_flip_control').click();
                    }
                } else if (e.key === 'r') {
                    $('button.anki_screen_setting.read_aloud_btn').click();
                } else if (e.key === 'f' && e.ctrlKey) {
                    e.preventDefault();
                    if (window.getSelection().toString() == '') {
                        window.open('https://www.google.com/search?tbm=isch&q='+getCard(activeIndex).find('.text').text(), '_blank');
                    } else {
                        window.open('https://www.google.com/search?tbm=isch&q='+window.getSelection().toString(), '_blank');
                    }
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    $('button.anki_screen_setting.stop').click();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    let textFontSize = getCard(activeIndex).find('.text').css('font-size');
                    let hintFontSize = getCard(activeIndex).find('.hint').css('font-size');
                    getCard(activeIndex).find('.text').css('font-size', (parseFloat(textFontSize)+10)+'px');
                    getCard(activeIndex).find('.hint').css('font-size', (parseFloat(hintFontSize)+10)+'px');
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    let textFontSize = getCard(activeIndex).find('.text').css('font-size');
                    let hintFontSize = getCard(activeIndex).find('.hint').css('font-size');
                    getCard(activeIndex).find('.text').css('font-size', (parseFloat(textFontSize)-10)+'px');
                    getCard(activeIndex).find('.hint').css('font-size', (parseFloat(hintFontSize)-10)+'px');
                } else if (e.key === 'e' && e.ctrlKey) {
                    e.preventDefault();
                    let cardNumber = getCard(activeIndex).parent().data('no');
                    window.open('https://ankilot.com/edit/?id='+getParam('id')+'&hl='+cardNumber);
                }
            }
        }

        $('#canvas_textarea')[0].onkeydown = function(e) {
            if ((e.key === 'Enter' | e.key === ' ') && !e.shiftKey) {
                e.stopPropagation();
            } else if (e.key === 'c' | e.key === 'p' | e.key === 'r') {
                e.stopPropagation();
            } else if ((e.key === 'ArrowUp' | e.key === 'ArrowDown' | e.key === 'ArrowRight' | e.key === 'ArrowLeft') && !e.shiftKey) {
                e.stopPropagation();
            }
        }

        // 画面ずれ防止
        $("html").css({ "overflow": "hidden" });
        $("body").css({ "overflow": "hidden", "position": "fixed" });

        // 設定適用
        if ($('input.anki_screen_setting.hide_checked').prop('checked') && !inPause) {
            $('#anki_screen ul.card_list li.pre_checked').addClass('checked');
            $('#anki_screen ul.card_list li.pre_checked').removeClass('pre_checked');
        }
        if ($('input.anki_screen_setting.shuffle').prop('checked') && !inPause) {
            shuffleCard();
        }
        if ($('input.anki_screen_setting.auto_flip').prop('checked')) {
            /*
            const chengeTime = Number($("input.anki_screen_setting.auto_flip_time").val()) * 1000;
            if (chengeTime > 0) {
                autoFlip = setInterval(function() {
                    nextCard();
                }, chengeTime);
            } else {
                // 音声
                if ($('input.anki_screen_setting.read_aloud').prop('checked')) {
                    autoFlip = setInterval(function() {
                        if (!speechSynthesis.speaking) {
                            nextCard();
                        }
                    }, 300);
                }
            }
            */
            setAutoFlip();
            $('button.anki_screen_setting.auto_flip_control').html('<i class="fas fa-pause"></i>');
            $('button.anki_screen_setting.auto_flip_control').show();
        } else {
            $('button.anki_screen_setting.auto_flip_control').hide();
        }
        if ($('input.anki_screen_setting.voice_flip').prop('checked')) {
            startVoiceFlip();
        }
        if (!restart && $('input.anki_screen_setting.voice_recognition').prop('checked')) {
            startVoiceRecognition();
        }
        if ($('input.anki_screen_setting.memo').prop('checked')) {
            $('#anki_screen .memo').show();
            initAnkiCanvas();
        } else {
            $('#anki_screen .memo').hide();
        }
        if ($('input.anki_screen_setting.text_style').prop('checked')) {
            let fontWeight = $('.anki_screen_setting.text_style_weight').val();
            let fontColor = $('.anki_screen_setting.text_style_color').val();
            let fontPosition = $('.anki_screen_setting.text_style_position').val();
            let hintVisible = $('.anki_screen_setting.text_style_hint').val();
            let fontSize = $('.anki_screen_setting.text_style_size').val();
            let cardAnimation = $('.anki_screen_setting.text_style_animation').val();

            if (fontWeight == 'bold') {
                $('#anki_screen .card .text, #anki_screen .card .hint').css('font-weight', '800');
            } else {
                $('#anki_screen .card .text, #anki_screen .card .hint').css('font-weight', '');
            }
            if (fontColor == 'normal') {
                $('#anki_screen .card .text, #anki_screen .card .hint').css('color', '');
            } else if (fontColor) {
                $('#anki_screen .card .text, #anki_screen .card .hint').css('color', fontColor);
            } else {
                $('#anki_screen .card .text, #anki_screen .card .hint').css('color', '');
            }
            if (fontPosition == 'relative') {
                $('#anki_screen .card .text').css('order', '2');
                $('#anki_screen .card .hint').css('order', '3');
                $('#anki_screen .card .image').css({'position': 'relative', 'margin': '10px', 'max-height': '50%', 'order': '1', 'object-fit': '', 'width': ''});
            } else if (fontPosition == 'absolute') {
                $('#anki_screen .card .text, #anki_screen .card .hint').css({'order': ''});
                $('#anki_screen .card .image').css({'position': '', 'margin': '', 'max-height': '', 'order': '','object-fit': '', 'width': ''});
            } else if (fontPosition == 'overall') {
                $('#anki_screen .card .text, #anki_screen .card .hint').css({'order': ''});
                $('#anki_screen .card .image').css({'position': '', 'margin': '', 'max-height': '', 'order': '', 'object-fit': 'contain', 'width': '100%'});
            }
            if (hintVisible == 'normal') {
                $('#anki_screen .card .hint').removeClass('hide');
                $('#anki_screen .card .hint').show();
            } else if (hintVisible == 'toggle') {
                $('#anki_screen .card .hint').show();
                $('#anki_screen .card .hint').addClass('hide');
            } else if (hintVisible == 'hide') {
                $('#anki_screen .card .hint').hide();
            }
            if (fontSize != 'auto') {
                $('#anki_screen .card .text').css('font-size', fontSize+'px');
                $('#anki_screen .card .hint').css('font-size', fontSize+'px');
                fontSizeReset = true;
            } else {
                if (fontSizeReset) {
                    $('#anki_screen .card .text').css('font-size', '');
                    $('#anki_screen .card .hint').css('font-size', '');
                }
                fontSizeReset = false;
            }
            if (cardAnimation == 'normal') {
                $('#anki_screen ul.card_list').removeClass('animation_none animation_fade animation_slide');
            } else {
                $('#anki_screen ul.card_list').removeClass('animation_none animation_fade animation_slide');
                $('#anki_screen ul.card_list').addClass('animation_'+cardAnimation);
            }
        } else {
            $('#anki_screen ul.card_list').removeClass('animation_none animation_fade animation_slide');
            $('#anki_screen .card .text, #anki_screen .card .hint').css({'color': '', 'font-weight': '', 'order': ''});
            $('#anki_screen .card .image').css({'position': '', 'margin': '', 'max-height': '', 'order': '', 'object-fit': '', 'width': ''});
            if (fontSizeReset) {
                $('#anki_screen .card .text').css('font-size', '');
                $('#anki_screen .card .hint').css('font-size', '');
            }
            fontSizeReset = false;
        }

        // ビュワーの設定を保存
        if ($('input.anki_screen_setting.viewer_config').val()) {
            const viewerConfig = {
                'anki_easy_flip': $('input.anki_screen_setting.easy_flip').prop('checked'),
                'anki_hide_checked': $('input.anki_screen_setting.hide_checked').prop('checked'),
                'anki_reverse': $('input.anki_screen_setting.reverse').prop('checked'),
                'anki_shuffle': $('input.anki_screen_setting.shuffle').prop('checked'),
                'anki_infinite_loop': $('input.anki_screen_setting.infinite_loop').prop('checked'),
                'anki_memo': $('input.anki_screen_setting.memo').prop('checked'),
                'anki_disable_shortcut': $('input.anki_screen_setting.disable_shortcut').prop('checked'),
                'anki_auto_flip': $('input.anki_screen_setting.auto_flip').prop('checked'),
                'anki_auto_flip_time': parseFloat($('input.anki_screen_setting.auto_flip_time').val()),
                'anki_auto_flip_time2': parseFloat($('input.anki_screen_setting.auto_flip_time2').val()),
                'anki_voice_flip': $('input.anki_screen_setting.voice_flip').prop('checked'),
                'anki_voice_recognition': $('input.anki_screen_setting.voice_recognition').prop('checked'),
                'anki_read_aloud': $('input.anki_screen_setting.read_aloud').prop('checked'),
                'anki_read_aloud_side': $('select.anki_screen_setting.read_aloud_side').val(),
                'anki_read_aloud_type': $('select.anki_screen_setting.read_aloud_type').val(),
                'anki_read_aloud_voice_front': $('select.anki_screen_setting.read_aloud_voice_front').val(),
                'anki_read_aloud_voice_back': $('select.anki_screen_setting.read_aloud_voice_back').val(),
                'anki_text_style': $('input.anki_screen_setting.text_style').prop('checked'),
                'anki_text_style_color': $('select.anki_screen_setting.text_style_color').val(),
                'anki_text_style_weight': $('select.anki_screen_setting.text_style_weight').val(),
                'anki_text_style_size': $('.anki_screen_setting.text_style_size').val(),
                'anki_text_style_position': $('select.anki_screen_setting.text_style_position').val(),
                'anki_text_style_hint': $('select.anki_screen_setting.text_style_hint').val(),
                'anki_text_style_animation': $('select.anki_screen_setting.text_style_animation').val()
            }
            setViewerConfig($('input.anki_screen_setting.viewer_config').val(), viewerConfig)
        }

        // カードを数える
        if ($('input.anki_screen_setting.hide_checked').prop('checked')) {
            cardCount = $('#anki_screen ul.card_list li .card').length - $('#anki_screen ul.card_list li.checked .card').length;
            if (cardCount == 1) {
                addNotice('info', '全てのカードがチェック済みになりました');
            }
        } else {
            cardCount = $('#anki_screen ul.card_list li .card').length;
            if (cardCount == 1) {
                addNotice('error', 'カードがありません');
            }
        }

        // リセット
        if (!inPause) {
            activeIndex = 0;
            animationIndex = 0;
            animationType = 'next';
            loopCount = loopCount ? loopCount + 1 : 1;

            $("#anki_screen ul.card_list li .card.animation_next").removeClass('animation_next');
            $("#anki_screen ul.card_list li .card.animation_prev").removeClass('animation_prev');
            $("#anki_screen ul.card_list li .card.active").removeClass('active');
            getCard(0).addClass('active');
        }
        inPause = false;

        if (!$('input.anki_screen_setting.text_style').prop('checked') || $('.anki_screen_setting.text_style_size').val() == 'auto') {
            adjustFontSize(getCard(activeIndex));
        }

        // 読み上げ
        if ($('input.anki_screen_setting.read_aloud').prop('checked')) {
            let side = $('select.anki_screen_setting.read_aloud_side').val();
            let readType = $('select.anki_screen_setting.read_aloud_type').val();
            if (side == 'both' || (side == 'front' && activeIndex%2 == 0) || (side == 'back' && activeIndex%2 == 1)) {
                let speechCard;
                if (readType == 'front') {
                    speechCard = getCard(activeIndex % 2 ? activeIndex - 1 : activeIndex);
                } else if (readType == 'back') {
                    speechCard = getCard(activeIndex % 2 ? activeIndex : activeIndex + 1);
                } else if (readType == 'reverse') {
                    speechCard = getCard(activeIndex % 2 ? activeIndex - 1 : activeIndex + 1);
                } else {
                    speechCard = getCard(activeIndex);
                }
                let speechTextElem = $('<span></span>').html(speechCard.find('.text').html());
                speechTextElem.find('.silent').html('.');

                speechText(speechTextElem.text(), speechCard.find('.language').val(), $('.anki_screen_setting.read_aloud_voice_' + (activeIndex%2 ? 'back' : 'front')).val());
            }
        }

        updateStatus();
    }

    /**
     * 暗記スクリーンを終了
     */
    function stopAnkiScreen(restart = false) {

        document.onkeydown = function(e) {}

        $("html").css({ "overflow": "" });
        $("body").css({ "overflow": "", "position": "", "overflow-y": "auto" });

        if (!restart) {
            stopVoiceFlip();
            stopVoiceRecognition();
        }
        clearAutoFlip();
        speechSynthesis.cancel();

        $('button.anki_screen_setting.init').text('暗記を開始する');
    }

    /**
     * 暗記スクリーンを一時停止
     */
    function pauseAnkiScreen() {

        document.onkeydown = function(e) {}

        $("html").css({ "overflow": "" });
        $("body").css({ "overflow": "", "position": "", "overflow-y": "auto" });

        stopVoiceFlip();
        stopVoiceRecognition();
        inPause = true;
        clearAutoFlip();
        speechSynthesis.cancel();

        $('button.anki_screen_setting.init').text('暗記を再開する');
    }

    /**
     * 次のカードに進む
     */
    function nextCard() {
        if (activeIndex >= cardCount - 2) {
            if ($('input.anki_screen_setting.infinite_loop').prop('checked')) {
                stopAnkiScreen();
                initAnkiScreen();
                return false;
            }
        }
        if (activeIndex >= cardCount - 1) {
            clearAutoFlip();
            return false;
        }
        getCard(animationIndex).removeClass('animation_'+animationType);
        getCard(activeIndex).removeClass('active');
        getCard(activeIndex+1).addClass('active');
        getCard(activeIndex).addClass('animation_next');

        animationType = 'next';
        animationIndex = activeIndex;
        activeIndex++;

        // 読み上げ
        if ($('input.anki_screen_setting.read_aloud').prop('checked')) {
            let side = $('select.anki_screen_setting.read_aloud_side').val();
            let readType = $('select.anki_screen_setting.read_aloud_type').val();
            if (side == 'both' || (side == 'front' && activeIndex%2 == 0) || (side == 'back' && activeIndex%2 == 1)) {
                let speechCard;
                if (readType == 'front') {
                    speechCard = getCard(activeIndex % 2 ? activeIndex - 1 : activeIndex);
                } else if (readType == 'back') {
                    speechCard = getCard(activeIndex % 2 ? activeIndex : activeIndex + 1);
                } else if (readType == 'reverse') {
                    speechCard = getCard(activeIndex % 2 ? activeIndex - 1 : activeIndex + 1);
                } else {
                    speechCard = getCard(activeIndex);
                }
                let speechTextElem = $('<span></span>').html(speechCard.find('.text').html());
                speechTextElem.find('.silent').html('');

                speechText(speechTextElem.text(), speechCard.find('.language').val(), $('.anki_screen_setting.read_aloud_voice_' + (activeIndex%2 ? 'back' : 'front')).val());
            }
        }

        if ($('input.anki_screen_setting.auto_flip').prop('checked') && !autoFlipPauce) {
            setAutoFlip();
        }

        if (!$('input.anki_screen_setting.text_style').prop('checked') || $('.anki_screen_setting.text_style_size').val() == 'auto') {
            adjustFontSize(getCard(activeIndex));
        }

        updateStatus();
    }

    /**
     * 前のカードに戻る
     */
    function prevCard() {
        if (activeIndex <= 0) {
            return false;
        }
        getCard(animationIndex).removeClass('animation_'+animationType);
        getCard(activeIndex).removeClass('active');
        getCard(activeIndex-1).addClass('active');
        getCard(activeIndex-1).addClass('animation_prev');

        animationType = 'prev';
        animationIndex = activeIndex-1;
        activeIndex--;

        // 読み上げ
        if ($('input.anki_screen_setting.read_aloud').prop('checked')) {
            let side = $('select.anki_screen_setting.read_aloud_side').val();
            let readType = $('select.anki_screen_setting.read_aloud_type').val();
            if (side == 'both' || (side == 'front' && activeIndex%2 == 0) || (side == 'back' && activeIndex%2 == 1)) {
                let speechCard;
                if (readType == 'front') {
                    speechCard = getCard(activeIndex % 2 ? activeIndex - 1 : activeIndex);
                } else if (readType == 'back') {
                    speechCard = getCard(activeIndex % 2 ? activeIndex : activeIndex + 1);
                } else if (readType == 'reverse') {
                    speechCard = getCard(activeIndex % 2 ? activeIndex - 1 : activeIndex + 1);
                } else {
                    speechCard = getCard(activeIndex);
                }
                let speechTextElem = $('<span></span>').html(speechCard.find('.text').html());
                speechTextElem.find('.silent').html('');

                speechText(speechTextElem.text(), speechCard.find('.language').val(), $('.anki_screen_setting.read_aloud_voice_' + (activeIndex%2 ? 'back' : 'front')).val());
            }
        }

        if ($('input.anki_screen_setting.auto_flip').prop('checked') && !autoFlipPauce) {
            setAutoFlip();
        }

        if (!$('input.anki_screen_setting.text_style').prop('checked') || $('.anki_screen_setting.text_style_size').val() == 'auto') {
            adjustFontSize(getCard(activeIndex));
        }

        updateStatus();
    }

    /**
     * 指定のカードまでジャンプ
     */
    function jumpCard(index) {
        if (0 > index || index > cardCount - 1 || activeIndex == index) {
            return false;
        }
        getCard(animationIndex).removeClass('animation_'+animationType);
        getCard(activeIndex).removeClass('active');
        getCard(index).addClass('active');
        getCard(activeIndex).addClass('animation_next');

        animationType = 'next';
        animationIndex = activeIndex;
        activeIndex = index;

        // 読み上げ
        if ($('input.anki_screen_setting.read_aloud').prop('checked')) {
            let side = $('select.anki_screen_setting.read_aloud_side').val();
            let readType = $('select.anki_screen_setting.read_aloud_type').val();
            if (side == 'both' || (side == 'front' && activeIndex%2 == 0) || (side == 'back' && activeIndex%2 == 1)) {
                let speechCard;
                if (readType == 'front') {
                    speechCard = getCard(activeIndex % 2 ? activeIndex - 1 : activeIndex);
                } else if (readType == 'back') {
                    speechCard = getCard(activeIndex % 2 ? activeIndex : activeIndex + 1);
                } else if (readType == 'reverse') {
                    speechCard = getCard(activeIndex % 2 ? activeIndex - 1 : activeIndex + 1);
                } else {
                    speechCard = getCard(activeIndex);
                }
                let speechTextElem = $('<span></span>').html(speechCard.find('.text').html());
                speechTextElem.find('.silent').html('.');

                speechText(speechTextElem.text(), speechCard.find('.language').val(), $('.anki_screen_setting.read_aloud_voice_' + (activeIndex%2 ? 'back' : 'front')).val());
            }
        }

        if ($('input.anki_screen_setting.auto_flip').prop('checked') && !autoFlipPauce) {
            setAutoFlip();
        }

        if (!$('input.anki_screen_setting.text_style').prop('checked') || $('.anki_screen_setting.text_style_size').val() == 'auto') {
            adjustFontSize(getCard(activeIndex));
        }

        updateStatus();
    }

    /**
     * カード要素を取得
     */
    function getCard(index) {
        if ($('input.anki_screen_setting.hide_checked').prop('checked')) {
            return $('#anki_screen ul.card_list').find('li:not(.checked) .card').eq(index);
        } else {
            return $('#anki_screen ul.card_list').find('li .card').eq(index);
        }
    }

    /**
     * カードにチェックをつける
     */
    function checkCard() {
        let activeElem = getCard(activeIndex).parent();
        $.ajax({
            url: 'https://ankilot.com/ajax/tangocard/check',
            method: 'POST',
            data: {'id': activeElem.find('.id').val()},
            dataType: 'json'
        }).done(function(response) {
            if (response['status'] == 200) {
                if (response['data']['checked']) {
                    activeElem.addClass('pre_checked');
                } else {
                    activeElem.removeClass('checked pre_checked');
                }
            } else if (response['status'] == 403) {
                addNotice('error', 'チェックするにはログインしてください');
            } else {
                addNotice("error", "カードをチェックできませんでした");
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            addNotice("error", "カードをチェックできませんでした");
        });
    }

    /**
     * カードの表裏を逆にする
     */
    function reverseCard() {
        console.log('Reverse cards.');
        if (!$('#anki_screen ul.card_list').hasClass('reverse')) {
            $('#anki_screen ul.card_list').addClass('reverse');
            $('#anki_screen ul.card_list li').each(function(index, element) {
                $(element).find('.card.front').before($(element).find('.card.back'));
            });
        } else {
            reverseBackCard();
        }
    }

    /**
     * カードの表裏を逆にする
     */
    function reverseBackCard() {
        console.log('Reverse back cards.');
        $('#anki_screen ul.card_list li').each(function(index, element) {
            $(element).find('.card.back').before($(element).find('.card.front'));
        });
        $('#anki_screen ul.card_list').removeClass('reverse');
    }

    /**
     * カードをシャッフルする
     */
    function shuffleCard() {
        console.log('Shuffle cards.');
        // 最初にラストカードを退避
        const lastCard = $("#anki_screen ul.card_list li .card.last").parent().prop('outerHTML');
        $("#anki_screen ul.card_list .card.last").parent().remove();
        if (!$('#anki_screen ul.card_list').hasClass('shuffle')) {
            $('#anki_screen ul.card_list').addClass('shuffle');
            $("#anki_screen ul.card_list li").each(function(index, element) { $(element).addClass('no'+index); });
        }
        // ランダムに順番入れ替え
        let content = $("#anki_screen ul.card_list").find("> *");
        let m = content.length;
        while (m) {
            const i = Math.floor(Math.random() * m--);
            [content[m], content[i]] = [content[i], content[m]];
        }
        $("#anki_screen ul.card_list").html(content);
        $("#anki_screen ul.card_list").append(lastCard);
    }

    /**
     * カードのシャッフルをもとに戻す
     */
    function shuffleBackCard() {
        console.log('Shuffle back cards.');
        // 最初にラストカードを退避
        const lastCard = $("#anki_screen ul.card_list li .card.last").parent().prop('outerHTML');
        $("#anki_screen ul.card_list .card.last").parent().remove();

        const content = $("#anki_screen ul.card_list").find("> *");
        const total = content.length;
        for (let index = 0;index < total;index++) {
            $("#anki_screen ul.card_list li.no"+index).appendTo($("#anki_screen ul.card_list"));
            $("#anki_screen ul.card_list li.no"+index).removeClass('no'+index);
        }
        $("#anki_screen ul.card_list").append(lastCard);
        $('#anki_screen ul.card_list').removeClass('shuffle');
    }

    /**
     * 各種ボタンなどを更新する
     */
    function updateStatus() {
        const percent = activeIndex / (cardCount - 1) * 100;
        if (percent == 100 || cardCount == 1) {
            // ステータス
            $('#anki_screen .status .progress_bar .value').css('width', '100%');
            $('#anki_screen .status .progress_bar .value span').css('opacity', 1);
            $('#anki_screen .status span.card_number').text('お疲れさまです');
            // コントロール
            $('#anki_screen .control label.check_box').hide();
        } else {
            // ステータス
            $('#anki_screen .status .progress_bar .value').css('width', percent+'%');
            $('#anki_screen .status .progress_bar .value span').css('opacity', 0);
            $('#anki_screen .status span.card_number').text((Math.floor(activeIndex/2)+1)+'/'+((cardCount-1)/2)+'枚目の'+((activeIndex%2==0?'表':'裏'))+(loopCount>1?' ('+loopCount+'周目)':''));
            // コントロール
            $('#anki_screen .control label.check_box').show();
            $('#anki_screen .control label.check_box input').prop('checked', (getCard(activeIndex).parent().hasClass('checked') | getCard(activeIndex).parent().hasClass('pre_checked')));
        }

        if (getCard(activeIndex).find('.image').length == 1) {
            $('#anki_screen .control label.image_exp_wrap').show();
        } else {
            $('#anki_screen .control label.image_exp_wrap').hide();
        }
        if (getCard(activeIndex).find('.text').text() != '') {
            $('#anki_screen .control label.read_aloud_wrap').show();
        } else {
            $('#anki_screen .control label.read_aloud_wrap').hide();
        }
    }

    /* 画像拡大 */
    function imageExpansion() {
        const ankiImage = getCard(activeIndex).find(".image");
        $("body").append('<div id="zoom_image_wrap"><button class="anki_screen_setting image_disexp"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M512 52.535L459.467.002l-203.465 203.46L52.538.002 0 52.535l203.47 203.47L0 459.465l52.533 52.533 203.469-203.471 203.465 203.471L512 459.475l-203.464-203.47z"/></svg></button>' + ankiImage.prop('outerHTML') + '</div>');

        const viewer = new Viewer($("#zoom_image_wrap .image").get(0), {
            title: false,
            inline: true,
            navbar: false,
            toolbar: true,
            viewed() {
                viewer.zoomTo(1);
            },
        });

        imageExp = true;
    }

    /* 画像拡大を解除 */
    function imageExpansionDisable() {
        $("#zoom_image_wrap").remove();

        imageExp = false;
    }

    /* 自動めくりをキャンセル */
    function clearAutoFlip() {
        if (autoFlip) {
            clearInterval(autoFlip);
            autoFlip = null;
        }
    }

    /* 自動めくり */
    function setAutoFlip() {
        clearAutoFlip();
        const chengeTime = Number(!(activeIndex % 2) ? $("input.anki_screen_setting.auto_flip_time").val() : $("input.anki_screen_setting.auto_flip_time2").val()) * 1000;
        if (chengeTime > 0) {
            autoFlip = setTimeout(nextCard, chengeTime);
        } else {
            // 音声に合わせて
            if ($('input.anki_screen_setting.read_aloud').prop('checked')) {
                autoFlip = setInterval(function() {
                    if (!speechSynthesis.speaking) {
                        nextCard();
                    }
                }, 300);
            }
        }
        autoFlipPauce = false;
    }

    /* 音声認識 */
    var voiceFlipAnalyzer = null;
    var voiceFlipLastData = [];
    var voiceFlipIntervalId = null;
    var voiceFlipFlag = true;

    function startVoiceFlip() {
        var mediaDevices = navigator.mediaDevices || ((navigator.mozGetUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia) ? {
            getUserMedia(c) {
                return new Promise(((y, n) => {
                    (navigator.mozGetUserMedia || navigator.webkitGetUserMedia).call(navigator, c, y, n);
                }));
            }
        } : null);

        if (mediaDevices) {
            mediaDevices.getUserMedia({
                video: false,
                audio: true
            })
            .then(function(stream) {
                var src = audioCtx.createMediaStreamSource(stream);
                src.connect(voiceFlipAnalyzer);

                voiceFlipIntervalId = setInterval(voiceFlipControl, 100);
                setTimeout(function() { voiceFlipFlag = false; }, 2000);
                voiceFlipControl();
            });

            var audioCtx = new(window.AudioContext || window.webkitAudioContext)();
            voiceFlipAnalyzer = audioCtx.createAnalyser();
            voiceFlipAnalyzer.smoothingTimeConstant = 0;
            voiceFlipAnalyzer.fftSize = 1024;
        }
    }

    function stopVoiceFlip() {
        if (voiceFlipIntervalId != null) {
            clearInterval(voiceFlipIntervalId);
        }
        voiceFlipAnalyzer = null;
        voiceFlipLastData = [];
        voiceFlipIntervalId = null;
        voiceFlipFlag = true;
    }

    function voiceFlipControl() {
        var data = new Uint8Array(voiceFlipAnalyzer.frequencyBinCount);
        voiceFlipAnalyzer.getByteFrequencyData(data);
        var volume = getArrayAverage(data);

        if (!voiceFlipFlag && volume > getArrayAverage(voiceFlipLastData) * 3) {
            nextCard();
            voiceFlipFlag = true;
            setTimeout(function() {
                voiceFlipFlag = false;
            }, 1000);
        }

        for (let i = 0; i < (voiceFlipLastData.length < 9 ? voiceFlipLastData.length : 9); i++) {
            voiceFlipLastData[i+1] = voiceFlipLastData[i];
        }
        voiceFlipLastData[0] = volume;
    }

    function getArrayAverage(array) {
        var total = 0;
        for (var i = 0; i < array.length; i++) {
            total += array[i];
        }
        return total / array.length;
    }

    var voiceRecognition = null;
    var voiceRecognitionFinish = true;
    function startVoiceRecognition() {
        if (voiceRecognition == null) {
            var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
            // grammarはたぶん適用されてない?
            // var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;

            // var speechRecognitionList = new SpeechGrammarList();
            // speechRecognitionList.addFromString('#JSGF V1.0 JIS ja; grammar commands; public <command> = つぎ | すすむ | もどる ;', 1);

            if (typeof SpeechRecognition === 'undefined'){
                addNotice('error', '音声認識に対応していないブラウザです');
            }

            voiceRecognition = new SpeechRecognition();
            voiceRecognition.lang = 'ja-JP';
            voiceRecognition.interimResults = false;
            voiceRecognition.continuous = false;
            voiceRecognition.maxAlternatives = 1;
            // voiceRecognition.grammars = speechRecognitionList;

            voiceRecognition.onresult = function(e) {
                console.log('[Voice Recognition] '+e.results[0][0].transcript);
                if (/次|つぎ|進む|すすむ|進め|すすめ|めくる/.test(e.results[0][0].transcript)) {
                    nextCard();
                } else if (/前|まえ|戻る|もどる|戻す|もどす|戻れ|もどれ/.test(e.results[0][0].transcript)) {
                    prevCard();
                } else if (/読み上げ/.test(e.results[0][0].transcript)) {
                    $('button.anki_screen_setting.read_aloud_btn').click();
                } else if (/チェック/.test(e.results[0][0].transcript)) {
                    $('#anki_screen .control label.check_box input').click();
                } else {
                    nextCard();
                }
            }
            voiceRecognition.onend = function() {
                if (!voiceRecognitionFinish) {
                    console.log('[Voice Recognition] Restart voice recognition.');
                    voiceRecognition.start();
                }
            }
        }

        console.log('[Voice Recognition] Start voice recognition.');
        voiceRecognitionFinish = false;
        voiceRecognition.start();
    }

    function stopVoiceRecognition() {
        if (voiceRecognition) {
            voiceRecognitionFinish = true;
            voiceRecognition.abort();
        }
    }

    function getSpeechVoices() {
        if ('speechSynthesis' in window) {
            var voices = window.speechSynthesis.getVoices();
            $('.anki_screen_setting.read_aloud_voice_front').html('<option value="auto">自動</option>');
            $('.anki_screen_setting.read_aloud_voice_back').html('<option value="auto">自動</option>');
            for (var i = 0; i < voices.length; i++) {
                $('.anki_screen_setting.read_aloud_voice_front').append('<option value="'+voices[i].voiceURI+'">'+voices[i].name+'</option>');
                $('.anki_screen_setting.read_aloud_voice_back').append('<option value="'+voices[i].voiceURI+'">'+voices[i].name+'</option>');
            }
        } else {
            $('.anki_screen_setting.read_aloud_voice_front').html('<option value="auto">読み上げに対応していません</option>');
            $('.anki_screen_setting.read_aloud_voice_back').html('<option value="auto">読み上げに対応していません</option>');
        }
    }

    // 暗記キャンバス
    let dcv, gcv, dcvx, gcvx, brush, lastPos, control;
    function initAnkiCanvas() {
        brush = { type: "pencil", size: 3, color: '#444' };
        lastPos = null;
        control = false;
        dcv = $('#draw_canvas')[0];
        gcv = $('#guide_canvas')[0];
        dcvx = dcv.getContext('2d');
        gcvx = gcv.getContext('2d');
        dcv.width = $('#anki_screen .memo .canvas_wrap').width();
        dcv.height = $('#anki_screen .memo .canvas_wrap').height();
        gcv.width = $('#anki_screen .memo .canvas_wrap').width();
        gcv.height = $('#anki_screen .memo .canvas_wrap').height();

        // キャンバスタッチ開始
        $(dcv).on("mousedown touchstart", function(e) {
            control = true;
            e.preventDefault();
            lastPos = getAnkiCancasPos(e);
        });

        // キャンバスタッチ中
        $(dcv).on("touchmove mousemove", function(e) {
            if (control) {
                e.preventDefault();

                pos = getAnkiCancasPos(e);

                gcvx.clearRect(0, 0, gcv.width, gcv.height);
                gcvx.beginPath();
                gcvx.strokeStyle = '#777';
                gcvx.lineWidth = 1;
                gcvx.arc(pos.x, pos.y, brush.size / 2, 0, Math.PI * 2, 0);
                gcvx.stroke();

                dcvx.beginPath();

                if (brush.type == 'pencil') {
                    dcvx.globalCompositeOperation="source-over";
                } else if (brush.type == 'eraser') {
                    dcvx.globalCompositeOperation="destination-out";
                }

                dcvx.lineCap = 'round';
                dcvx.lineJoin = 'round';
                dcvx.strokeStyle = brush.color;

                gcvx.beginPath();
                gcvx.strokeStyle = '#777';
                gcvx.lineWidth = 1;
                gcvx.arc(pos.x, pos.y, brush.size / 2, 0, Math.PI * 2, 0);
                gcvx.stroke();

                dcvx.lineWidth = brush.size;
                dcvx.moveTo(lastPos.x, lastPos.y);
                dcvx.lineTo(pos.x, pos.y);
                dcvx.stroke();
                dcvx.closePath();

                lastPos = pos;
            }
        });

        // キャンバスタッチ終了
        $(dcv).on("touchend mouseup mouseout", function() {
            if (control) {
                control = false;
                lastPos = null;
                gcvx.clearRect(0, 0, gcv.width, gcv.height);
            }
        });
    }
    function getAnkiCancasPos(event) {
        let zoom = $('.canvas_wrap').css('zoom');
        let pos = {};
        if (event.changedTouches) {
            let touchObject = event.changedTouches[0] ;
            pos.x = (touchObject.pageX / zoom) - $(dcv).offset().left;
            pos.y = (touchObject.pageY / zoom) - $(dcv).offset().top;
        } else {
            pos.x = event.offsetX / zoom;
            pos.y = event.offsetY / zoom;
        }
        return pos;
    }
});

function resetAllCheck(tangocho_id) {
    if (confirm('本当にすべてのチェックをリセットしますか。')) {
        $.ajax({
            url: 'https://ankilot.com/ajax/tangocard/check_reset',
            method: 'POST',
            data: {'id': tangocho_id},
            dataType: 'json'
        }).done(function(response) {

            if (response['status'] == 200) {
                $("#anki_screen ul.card_list li.checked").each(function(index, element) {
                    $(element).removeClass('checked');
                });
                $("#anki_screen ul.card_list li.pre_checked").each(function(index, element) {
                    $(element).removeClass('pre_checked');
                });
                addNotice('info', response['data']['count'] + '個のチェックをリセットしました');
            } else if (response['status'] == 403) {
                addNotice('error', 'チェックをリセットするにはログインしてください');
            } else {
                addNotice('error', 'チェックのリセットに失敗しました');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            addNotice("error", "チェックのリセットに失敗しました");
        });
    }
}
