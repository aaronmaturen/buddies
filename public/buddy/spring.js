// Damped spring toward `t`. k is stiffness, z the damping ratio (1 = no overshoot).
export class Spring {
  constructor(v = 0) { this.x = v; this.v = 0; this.t = v; }
  step(dt, k, z = 1) {
    const a = k * (this.t - this.x) - 2 * Math.sqrt(k) * z * this.v;
    this.v += a * dt;
    this.x += this.v * dt;
  }
}
