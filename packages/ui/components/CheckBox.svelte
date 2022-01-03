<script>
  export let label = "CheckBox";
  export let disabled = false;
  export let checked;
</script>

<input
  {disabled}
  type="checkbox"
  id="cbx"
  class="inp-cbx"
  style="display: none"
  bind:checked
/>
<label class:disabled for="cbx" class="cbx">
  <span>
    <svg width="12px" height="10px" viewBox="0 0 12 10">
      <polyline points="1.5 6 4.5 9 10.5 1" />
    </svg>
  </span>
  <span>{label}</span>
</label>

<style>
  .cbx.disabled {
    color: grey;
  }
  .cbx.disabled span:first-child {
    background-color: grey;
  }
  .cbx {
    margin: auto;
    -webkit-user-select: none;
    user-select: none;
    cursor: pointer;
  }
  .cbx span {
    display: inline-block;
    vertical-align: middle;
    transform: translate3d(0, 0, 0);
  }
  .cbx span:first-child {
    position: relative;
    width: 18px;
    height: 18px;
    border-radius: 0px;
    transform: scale(1);
    vertical-align: middle;
    background-color: white;
    border-radius: 3px;
    transition: all 0.2s ease;
  }
  .cbx span:first-child svg {
    position: absolute;
    top: 3px;
    left: 2px;
    fill: none;
    stroke: #ffffff;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 16px;
    stroke-dashoffset: 16px;
    transition: all 0.3s ease;
    transition-delay: 0.1s;
    transform: translate3d(0, 0, 0);
  }
  .cbx span:first-child:before {
    content: "";
    width: 100%;
    height: 100%;
    background: #e0e0e0;
    display: block;
    transform: scale(0);
    opacity: 1;
    border-radius: 50%;
  }
  .cbx span:last-child {
    padding-left: 3px;
  }
  .cbx:hover span:first-child {
    border-color: #000000;
  }

  .inp-cbx:checked + .cbx span:first-child {
    background: #272727;
    border-color: #000000;
    animation: wave 0.4s ease;
  }
  .inp-cbx:checked + .cbx span:first-child svg {
    stroke-dashoffset: 0;
  }
  .inp-cbx:checked + .cbx span:first-child:before {
    transform: scale(3.5);
    opacity: 0;
    transition: all 0.6s ease;
  }

  @keyframes wave {
    50% {
      transform: scale(0.9);
    }
  }
</style>
