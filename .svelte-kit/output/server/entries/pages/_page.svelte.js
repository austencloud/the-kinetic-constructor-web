import "clsx";
import { d as bind_props, c as pop, e as stringify, p as push, f as ensure_array_like } from "../../chunks/index.js";
import { f as fallback } from "../../chunks/utils.js";
import { e as escape_html } from "../../chunks/escaping.js";
const replacements = {
  translate: /* @__PURE__ */ new Map([
    [true, "yes"],
    [false, "no"]
  ])
};
function attr(name, value, is_boolean = false) {
  if (value == null || !value && is_boolean || value === "" && name === "class") return "";
  const normalized = name in replacements && replacements[name].get(value) || value;
  const assignment = is_boolean ? "" : `="${escape_html(normalized, true)}"`;
  return ` ${name}${assignment}`;
}
function NavigationButton($$payload, $$props) {
  push();
  let name = $$props["name"];
  let isActive = fallback($$props["isActive"], false);
  let onClick = $$props["onClick"];
  let fontSize;
  let buttonWidth;
  let buttonHeight;
  $$payload.out += `<button${attr("style", ` font-size: ${stringify(fontSize)}px; width: ${stringify(buttonWidth)}px; height: ${stringify(buttonHeight)}px; font-family: Georgia, serif; padding: 5px 10px; border-radius: 5px; border: 1px solid gray; cursor: pointer; transition: all 0.3s ease; background-color: ${stringify(isActive ? "blue" : "white")}; color: ${stringify(isActive ? "white" : "black")}; font-weight: ${stringify(isActive ? "bold" : "normal")}; `)}>${escape_html(name)}</button>`;
  bind_props($$props, { name, isActive, onClick });
  pop();
}
function NavigationWidget($$payload, $$props) {
  push();
  let onTabChange = $$props["onTabChange"];
  let activeTab = 0;
  const tabNames = [
    "Construct ⚒️",
    "Generate 🤖",
    "Browse 🔍",
    "Learn 🧠",
    "Write ✍️"
  ];
  const handleTabClick = (index) => {
    activeTab = index;
    onTabChange && onTabChange(index);
  };
  const each_array = ensure_array_like(tabNames);
  $$payload.out += `<div class="nav-container svelte-19f77qk"><!--[-->`;
  for (let index = 0, $$length = each_array.length; index < $$length; index++) {
    let name = each_array[index];
    NavigationButton($$payload, {
      name,
      isActive: index === activeTab,
      onClick: () => handleTabClick(index)
    });
  }
  $$payload.out += `<!--]--></div>`;
  bind_props($$props, { onTabChange });
  pop();
}
function SettingsButton($$payload, $$props) {
  push();
  let background = $$props["background"];
  let onChangeBackground = $$props["onChangeBackground"];
  let buttonSize = 50;
  let iconSize = 38;
  $$payload.out += `<div><button class="settings-button svelte-lmlytb"${attr("style", `--button-size: ${stringify(buttonSize)}px;`)}><img class="settings-icon svelte-lmlytb"${attr("style", `--icon-size: ${stringify(iconSize)}px;`)} src="/button_panel_icons/settings.png" alt="Settings"></button> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  bind_props($$props, { background, onChangeBackground });
  pop();
}
function SocialMediaWidget($$payload) {
  const socialLinks = [
    {
      src: "/social_icons/paypal.png",
      alt: "PayPal",
      url: "https://www.paypal.me/austencloud"
    },
    {
      src: "/social_icons/venmo.png",
      alt: "Venmo",
      url: "https://venmo.com/austencloud"
    },
    {
      src: "/social_icons/github.png",
      alt: "GitHub",
      url: "https://github.com/austencloud/the-kinetic-constructor-web"
    },
    {
      src: "/social_icons/facebook.png",
      alt: "Facebook",
      url: "https://www.facebook.com/thekineticalphabet"
    },
    {
      src: "/social_icons/instagram.png",
      alt: "Instagram",
      url: "https://www.instagram.com/thekineticalphabet"
    },
    {
      src: "/social_icons/youtube.png",
      alt: "YouTube",
      url: "https://www.youtube.com/channel/UCbLHNRSASZS_gwkmRATH1-A"
    }
  ];
  const each_array = ensure_array_like(socialLinks);
  $$payload.out += `<div class="social-container svelte-4f3ryz"><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let link = each_array[$$index];
    $$payload.out += `<button class="button svelte-4f3ryz"${attr("aria-label", link.alt)}><img class="icon svelte-4f3ryz"${attr("src", link.src)}${attr("alt", link.alt)}></button>`;
  }
  $$payload.out += `<!--]--></div>`;
}
function MenuBar($$payload, $$props) {
  push();
  let background = $$props["background"];
  let onTabChange = $$props["onTabChange"];
  let onChangeBackground = $$props["onChangeBackground"];
  $$payload.out += `<header class="menu-bar svelte-mgkl34">`;
  SocialMediaWidget($$payload);
  $$payload.out += `<!----> `;
  NavigationWidget($$payload, { onTabChange });
  $$payload.out += `<!----> `;
  SettingsButton($$payload, { background, onChangeBackground });
  $$payload.out += `<!----></header>`;
  bind_props($$props, { background, onTabChange, onChangeBackground });
  pop();
}
function SequenceWidgetButton($$payload, $$props) {
  let icon = $$props["icon"];
  let title = $$props["title"];
  let buttonSize = $$props["buttonSize"];
  let onClick = $$props["onClick"];
  $$payload.out += `<button class="button svelte-1pc1yrd"${attr("style", ` width: ${stringify(buttonSize)}px; height: ${stringify(buttonSize)}px; background-color: ${stringify("white")}; transform: ${stringify("scale(1)")}; box-shadow: ${stringify("0px 2px 4px rgba(0, 0, 0, 0.1)")};`)}${attr("title", title)}><img${attr("src", icon)}${attr("alt", title)} class="svelte-1pc1yrd"></button>`;
  bind_props($$props, { icon, title, buttonSize, onClick });
}
function SequenceWidgetButtonPanel($$payload, $$props) {
  push();
  let buttonSize = 60;
  const buttons = [
    {
      icon: "/button_panel_icons/add_to_dictionary.png",
      title: "Add to Dictionary",
      id: "addToDictionary"
    },
    {
      icon: "/button_panel_icons/save_image.png",
      title: "Save Image",
      id: "saveImage"
    },
    {
      icon: "/button_panel_icons/eye.png",
      title: "View Full Screen",
      id: "viewFullScreen"
    },
    {
      icon: "/button_panel_icons/mirror.png",
      title: "Mirror Sequence",
      id: "mirrorSequence"
    },
    {
      icon: "/button_panel_icons/yinyang1.png",
      title: "Swap Colors",
      id: "swapColors"
    },
    {
      icon: "/button_panel_icons/rotate.png",
      title: "Rotate Sequence",
      id: "rotateSequence"
    },
    {
      icon: "/button_panel_icons/delete.png",
      title: "Delete Beat",
      id: "deleteBeat"
    },
    {
      icon: "/button_panel_icons/clear.png",
      title: "Clear Sequence",
      id: "clearSequence"
    }
  ];
  const each_array = ensure_array_like(buttons);
  $$payload.out += `<div class="button-panel svelte-e1et6j"><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let button = each_array[$$index];
    SequenceWidgetButton($$payload, {
      icon: button.icon,
      title: button.title,
      buttonSize,
      onClick: () => console.log(`${button.title} clicked`)
    });
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
function GraphEditorPictographContainer($$payload, $$props) {
  let maxHeight = $$props["maxHeight"];
  $$payload.out += `<div class="container svelte-q7gtkx"${attr("style", `width: ${stringify(maxHeight)}px; height: ${stringify(maxHeight)}px;`)}><p>Pictograph</p></div>`;
  bind_props($$props, { maxHeight });
}
function PropRotDirButton($$payload, $$props) {
  let icon = $$props["icon"];
  let color = $$props["color"];
  let onClick = $$props["onClick"];
  let isPressed = fallback($$props["isPressed"], false);
  $$payload.out += `<button class="button svelte-x1g6k2"${attr("style", `--color: ${stringify(color)}; --background-color: ${stringify(isPressed ? "#ccd9ff" : "white")}; --scale: ${stringify(isPressed ? "scale(0.95)" : "scale(1)")}`)}><img class="icon svelte-x1g6k2"${attr("src", icon)} alt="icon"></button>`;
  bind_props($$props, { icon, color, onClick, isPressed });
}
const rotateCWIcon = "/the-kinetic-constructor-web/_app/immutable/assets/clockwise.DWOPw8Vb.png";
const rotateCCWIcon = "/the-kinetic-constructor-web/_app/immutable/assets/counter_clockwise.DF9OdOJt.png";
function TurnsBoxHeader($$payload, $$props) {
  let color = $$props["color"];
  let onCWClick = $$props["onCWClick"];
  let onCCWClick = $$props["onCCWClick"];
  let isCWPressed = fallback($$props["isCWPressed"], false);
  let isCCWPressed = fallback($$props["isCCWPressed"], false);
  const iconPaths = {
    clockwise: rotateCWIcon,
    counterClockwise: rotateCCWIcon
  };
  $$payload.out += `<div class="container svelte-1nnonxz"${attr("style", `--border-color: ${stringify(color === "blue" ? "#2e3192" : "#ed1c24")}; --text-color: ${stringify(color === "blue" ? "#2e3192" : "#ed1c24")}`)}>`;
  PropRotDirButton($$payload, {
    icon: iconPaths.counterClockwise,
    color: color === "blue" ? "#2e3192" : "#ed1c24",
    onClick: onCCWClick,
    isPressed: isCCWPressed
  });
  $$payload.out += `<!----> <span class="header-label svelte-1nnonxz">${escape_html(color === "blue" ? "Left" : "Right")}</span> `;
  PropRotDirButton($$payload, {
    icon: iconPaths.clockwise,
    color: color === "blue" ? "#2e3192" : "#ed1c24",
    onClick: onCWClick,
    isPressed: isCWPressed
  });
  $$payload.out += `<!----></div>`;
  bind_props($$props, {
    color,
    onCWClick,
    onCCWClick,
    isCWPressed,
    isCCWPressed
  });
}
function TurnsTextLabel($$payload) {
  $$payload.out += `<div class="turns-text-label svelte-zw8vxg">Turns</div>`;
}
function IncrementButton($$payload, $$props) {
  let type = fallback($$props["type"], "increment");
  let color = fallback($$props["color"], "blue");
  $$payload.out += `<button class="increment-button svelte-1e3m0hz"${attr("style", `--color: ${stringify(color)}`)}${attr("aria-label", type === "increment" ? "Increase" : "Decrease")}>${escape_html(type === "increment" ? "+" : "−")}</button>`;
  bind_props($$props, { type, color });
}
function TurnsLabel($$payload, $$props) {
  let turns = fallback($$props["turns"], 0);
  let color = fallback($$props["color"], "blue");
  $$payload.out += `<div class="turns-label svelte-k7hvi8"${attr("style", `--color: ${stringify(color)}`)}>${escape_html(turns)}</div>`;
  bind_props($$props, { turns, color });
}
function TurnsDisplayFrame($$payload, $$props) {
  let color = fallback($$props["color"], "blue");
  let turns = 0;
  $$payload.out += `<div class="turns-display-frame svelte-1odcvo6">`;
  IncrementButton($$payload, { type: "decrement", color });
  $$payload.out += `<!----> `;
  TurnsLabel($$payload, { turns, color });
  $$payload.out += `<!----> `;
  IncrementButton($$payload, { type: "increment", color });
  $$payload.out += `<!----></div>`;
  bind_props($$props, { color });
}
function MotionTypeLabel($$payload, $$props) {
  let type = fallback($$props["type"], "Default");
  $$payload.out += `<div class="motion-type-label svelte-1kcjqem">Motion Type: ${escape_html(type)}</div>`;
  bind_props($$props, { type });
}
function TurnsWidget($$payload, $$props) {
  let color = $$props["color"];
  $$payload.out += `<div class="turns-widget svelte-1nmwj64">`;
  TurnsTextLabel($$payload);
  $$payload.out += `<!----> `;
  TurnsDisplayFrame($$payload, { color });
  $$payload.out += `<!----> `;
  MotionTypeLabel($$payload, {});
  $$payload.out += `<!----></div>`;
  bind_props($$props, { color });
}
function TurnsBox($$payload, $$props) {
  let color = $$props["color"];
  let isCWPressed = false;
  let isCCWPressed = false;
  const handleCWClick = () => {
    isCWPressed = true;
    isCCWPressed = false;
    console.log(`${color} prop rotation set to CW`);
  };
  const handleCCWClick = () => {
    isCWPressed = false;
    isCCWPressed = true;
    console.log(`${color} prop rotation set to CCW`);
  };
  $$payload.out += `<div class="turns-box svelte-1axoyzn"${attr("style", `--box-color: ${stringify(color === "blue" ? "#2e3192" : "#ed1c24")}; --box-gradient: ${stringify(color === "blue" ? "linear-gradient(135deg, rgba(46, 49, 146, 0.1), rgba(46, 49, 146, 0.3))" : "linear-gradient(135deg, rgba(237, 28, 36, 0.1), rgba(237, 28, 36, 0.3))")};`)}>`;
  TurnsBoxHeader($$payload, {
    color,
    onCWClick: handleCWClick,
    onCCWClick: handleCCWClick,
    isCWPressed,
    isCCWPressed
  });
  $$payload.out += `<!----> `;
  TurnsWidget($$payload, { color });
  $$payload.out += `<!----></div>`;
  bind_props($$props, { color });
}
function GraphEditor($$payload, $$props) {
  let isExpanded = $$props["isExpanded"];
  let animationDuration = $$props["animationDuration"];
  const maxEditorHeight = 300;
  $$payload.out += `<div class="graph-editor svelte-198l2cv"${attr("style", `--animation-duration: ${stringify(animationDuration)}ms; height: ${stringify(isExpanded ? maxEditorHeight + "px" : "0px")};`)}><div class="turns-box svelte-198l2cv">`;
  TurnsBox($$payload, { color: "blue" });
  $$payload.out += `<!----></div> <div class="pictograph-container svelte-198l2cv"${attr("style", `width: ${stringify(maxEditorHeight)}px; height: ${stringify(maxEditorHeight)}px;`)}>`;
  GraphEditorPictographContainer($$payload, { maxHeight: maxEditorHeight });
  $$payload.out += `<!----></div> <div class="turns-box svelte-198l2cv">`;
  TurnsBox($$payload, { color: "red" });
  $$payload.out += `<!----></div></div>`;
  bind_props($$props, { isExpanded, animationDuration });
}
function GraphEditorToggleTab($$payload, $$props) {
  push();
  let isExpanded = $$props["isExpanded"];
  let animationDuration = $$props["animationDuration"];
  let graphEditorHeight = $$props["graphEditorHeight"];
  if (typeof window !== "undefined") {
    document.documentElement.style.setProperty("--graph-editor-offset", `${graphEditorHeight}px`);
    document.documentElement.style.setProperty("--animation-duration", `${animationDuration}ms`);
  }
  $$payload.out += `<button class="toggleTab svelte-kchvum"${attr("aria-expanded", isExpanded)}${attr("aria-label", isExpanded ? "Collapse Editor" : "Expand Editor")}><span${attr("class", `icon ${stringify(isExpanded ? "expanded" : "")} svelte-kchvum`)}>▼</span> ${escape_html(isExpanded ? "Collapse Editor" : "Expand Editor")}</button>`;
  bind_props($$props, {
    isExpanded,
    animationDuration,
    graphEditorHeight
  });
  pop();
}
function SequenceWidget($$payload) {
  let isGraphEditorExpanded = false;
  const animationDuration = 300;
  $$payload.out += `<div class="sequence-widget-container svelte-116ql0w"><div class="sequence-widget svelte-116ql0w"><div class="sequence-widget-labels svelte-116ql0w"><div>Indicator Label</div> <div>Current Word</div> <div>Difficulty</div></div> <div class="sequence-widget-main svelte-116ql0w"><div class="scroll-area svelte-116ql0w">Scroll Area</div> `;
  SequenceWidgetButtonPanel($$payload);
  $$payload.out += `<!----></div></div> `;
  GraphEditorToggleTab($$payload, {
    isExpanded: isGraphEditorExpanded,
    animationDuration,
    graphEditorHeight: 0
  });
  $$payload.out += `<!----> `;
  GraphEditor($$payload, {
    isExpanded: isGraphEditorExpanded,
    animationDuration
  });
  $$payload.out += `<!----></div>`;
}
function OptionPicker($$payload) {
  let options = ["Option 1", "Option 2", "Option 3"];
  const each_array = ensure_array_like(options);
  $$payload.out += `<div class="optionPicker svelte-5ojx7n"><h2 class="title svelte-5ojx7n">Options:</h2> <div class="scrollArea svelte-5ojx7n"><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let option = each_array[$$index];
    $$payload.out += `<div class="option svelte-5ojx7n">${escape_html(option)}</div>`;
  }
  $$payload.out += `<!--]--></div></div>`;
}
function SnowfallBackground($$payload, $$props) {
  push();
  $$payload.out += `<canvas style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></canvas>`;
  pop();
}
function _page($$payload) {
  $$payload.out += `<div id="app" class="svelte-jqz26q"><div class="background svelte-jqz26q">`;
  SnowfallBackground($$payload);
  $$payload.out += `<!----></div> <div class="menuBar svelte-jqz26q">`;
  MenuBar($$payload, {
    background: "defaultBackground",
    onTabChange: () => {
    },
    onChangeBackground: (e) => {
    }
  });
  $$payload.out += `<!----></div> <div class="mainContent svelte-jqz26q"><div class="sequenceWidgetContainer svelte-jqz26q">`;
  SequenceWidget($$payload);
  $$payload.out += `<!----></div> <div class="optionPickerContainer svelte-jqz26q">`;
  OptionPicker($$payload);
  $$payload.out += `<!----></div></div></div>`;
}
export {
  _page as default
};
