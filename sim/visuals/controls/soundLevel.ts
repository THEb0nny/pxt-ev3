namespace pxsim.visuals {

    export class SoundLevelControl extends ControlView<NXTSoundSensorNode> {

        private group: SVGGElement;
        private colorGradient: SVGLinearGradientElement;
        private reporter: SVGTextElement;
        private rect: SVGElement;

        getInnerWidth() {
            return 111;
        }

        getInnerHeight() {
            return 192;
        }

        private getReporterHeight() {
            return 38;
        }

        private getSliderWidth() {
            return 62;
        }

        private getSliderHeight() {
            return 131;
        }

        private getMinValue() {
            return 0;
        }

        private getMaxValue() {
            return 100;
        }

        updateState() {
            if (!this.visible) return;

            const node = this.state;
            const value = Math.max(0, Math.min(100, node.getValue()));

            svg.setGradientValue(this.colorGradient, (100 - value) + "%");
            this.reporter.textContent = `${Math.floor(value)}%`;
        }

        updateSoundLevel(pt: SVGPoint, parent: SVGSVGElement, ev: MouseEvent) {
            const state = this.state;
            let cur = svg.cursorPoint(pt, parent, ev);
            const bBox = this.rect.getBoundingClientRect();
            const height = bBox.height;

            let t = Math.max(0, Math.min(1, (height + bBox.top / this.scaleFactor - cur.y / this.scaleFactor) / height));
            state.setValue(t * this.getMaxValue());
        }

        getInnerView(parent: SVGSVGElement, globalDefs: SVGDefsElement) {
            this.group = svg.elt("g") as SVGGElement;

            let gc = "gradient-sound-" + this.getPort();
            const prevColorGradient = globalDefs.querySelector(`#${gc}`) as SVGLinearGradientElement;
            this.colorGradient = prevColorGradient ? prevColorGradient : svg.linearGradient(globalDefs, gc, false);
            svg.setGradientValue(this.colorGradient, "50%");
            svg.setGradientColors(this.colorGradient, "#1e293b", "#06b6d4");

            const midX = 55.5;
            const sliderX = midX - this.getSliderWidth() / 2; // 55.5 - 31 = 24.5

            const reporterGroup = pxsim.svg.child(this.group, "g");
            reporterGroup.setAttribute("transform", `translate(${midX}, 20)`);
            this.reporter = pxsim.svg.child(reporterGroup, "text", {
                'text-anchor': 'middle',
                'dominant-baseline': 'central',
                'x': 0,
                'y': 0,
                'class': 'sim-text number large inverted'
            }) as SVGTextElement;

            const sliderGroup = pxsim.svg.child(this.group, "g");
            sliderGroup.setAttribute("transform", `translate(${sliderX}, ${this.getReporterHeight()})`);

            const rect = pxsim.svg.child(sliderGroup, "rect", {
                "width": this.getSliderWidth(),
                "height": this.getSliderHeight(),
                "rx": 4,
                "ry": 4,
                "style": `fill: url(#${gc})`
            });
            this.rect = rect;

            let pt = parent.createSVGPoint();
            let captured = false;
            touchEvents(rect, ev => {
                if (captured && (ev as MouseEvent).clientY) {
                    ev.preventDefault();
                    this.updateSoundLevel(pt, parent, ev as MouseEvent);
                }
            }, ev => {
                captured = true;
                if ((ev as MouseEvent).clientY) {
                    rect.setAttribute('cursor', '-webkit-grabbing');
                    this.updateSoundLevel(pt, parent, ev as MouseEvent);
                }
            }, () => {
                captured = false;
                rect.setAttribute('cursor', '-webkit-grab');
            });

            return this.group;
        }
    }
}