namespace pxsim.visuals {

    export class LightWheelControl extends ControlView<NXTLightSensorNode> {

        private group!: SVGGElement;
        private lightGradient!: SVGLinearGradientElement;
        private reporter!: SVGTextElement;
        private rect!: SVGElement;

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

        private getMinValue(state: NXTLightSensorNode) {
            if (state.getMode() == NXTLightSensorMode.ReflectedLight) return state.brightReflectedLight;
            else if (state.getMode() == NXTLightSensorMode.AmbientLight) return state.brightAmbientLight;
            return 0;
        }

        private getMaxValue(state: NXTLightSensorNode) {
            if (state.getMode() == NXTLightSensorMode.ReflectedLightRaw || state.getMode() == NXTLightSensorMode.AmbientLightRaw) {
                return 4095;
            } else if (state.getMode() == NXTLightSensorMode.ReflectedLight) {
                return state.darkReflectedLight;
            } else if (state.getMode() == NXTLightSensorMode.AmbientLight) {
                return state.darkAmbientLight;
            }
            return 100;
        }

        updateState() {
            if (!this.visible) return;

            const node = this.state;
            const value = node.getValue();
            let inverseValue = this.getMaxValue(node) - value + this.getMinValue(node);
            if (node.getMode() == NXTLightSensorMode.ReflectedLightRaw || node.getMode() == NXTLightSensorMode.AmbientLightRaw) {
                inverseValue = mapValue(inverseValue, 0, 4095, 0, 100);
            } else if (node.getMode() == NXTLightSensorMode.ReflectedLight) {
                inverseValue = mapValue(inverseValue, node.darkReflectedLight, node.brightReflectedLight, 0, 100);
            } else if (node.getMode() == NXTLightSensorMode.AmbientLight) {
                inverseValue = mapValue(inverseValue, node.darkAmbientLight, node.brightAmbientLight, 0, 100);
            }
            svg.setGradientValue(this.lightGradient, inverseValue + "%");
            if (node.getMode() == NXTLightSensorMode.ReflectedLightRaw || node.getMode() == NXTLightSensorMode.AmbientLightRaw) {
                this.reporter.textContent = `${Math.floor(parseFloat(value.toString()))}`;
            } else {
                this.reporter.textContent = `${Math.floor(mapValue(parseFloat(value.toString()), this.getMaxValue(node), this.getMinValue(node), 0, 100))}%`;
            }
        }

        updateLightLevel(pt: SVGPoint, parent: SVGSVGElement, ev: MouseEvent) {
            const state = this.state;
            let cur = svg.cursorPoint(pt, parent, ev);
            const bBox = this.rect.getBoundingClientRect();
            const height = bBox.height;
            let t = Math.max(0, Math.min(1, (height + bBox.top / this.scaleFactor - cur.y / this.scaleFactor) / height));
            if (state.getMode() == NXTLightSensorMode.ReflectedLight || state.getMode() == NXTLightSensorMode.AmbientLight) t = 1 - t;
            state.setValue(this.getMinValue(state) + t * (this.getMaxValue(state) - this.getMinValue(state)));
        }

        getInnerView(parent: SVGSVGElement, globalDefs: SVGDefsElement) {
            this.group = svg.elt("g") as SVGGElement;

            let gc = "gradient-light-" + this.getPort();
            const prevLightGradient = globalDefs.querySelector(`#${gc}`) as SVGLinearGradientElement;
            this.lightGradient = prevLightGradient ? prevLightGradient : svg.linearGradient(globalDefs, gc, false);
            svg.setGradientValue(this.lightGradient, "50%");
            svg.setGradientColors(this.lightGradient, "black", "yellow");

            const reporterGroup = pxsim.svg.child(this.group, "g");
            reporterGroup.setAttribute("transform", `translate(${this.getWidth() / 2}, 20)`);
            this.reporter = pxsim.svg.child(reporterGroup, "text", { 
                'text-anchor': 'middle', 
                'x': 0, 
                'y': 0, 
                'class': 'sim-text number large inverted'
            }) as SVGTextElement;

            const sliderGroup = pxsim.svg.child(this.group, "g");
            sliderGroup.setAttribute("transform", `translate(${this.getWidth() / 2 - this.getSliderWidth() / 2}, ${this.getReporterHeight()})`);

            const rect = pxsim.svg.child(sliderGroup, "rect", {
                "width": this.getSliderWidth(),
                "height": this.getSliderHeight(),
                "style": `fill: url(#${gc})`
            });
            this.rect = rect;

            let pt = parent.createSVGPoint();
            let captured = false;
            touchEvents(rect, ev => {
                if (captured && (ev as MouseEvent).clientY) {
                    ev.preventDefault();
                    this.updateLightLevel(pt, parent, ev as MouseEvent);
                }
            }, ev => {
                captured = true;
                if ((ev as MouseEvent).clientY) {
                    rect.setAttribute('cursor', '-webkit-grabbing');
                    this.updateLightLevel(pt, parent, ev as MouseEvent);
                }
            }, () => {
                captured = false;
                rect.setAttribute('cursor', '-webkit-grab');
            });

            return this.group;
        }
    }
}