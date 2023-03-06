// 查找名为 "main components" 的页面，如果没有则创建一个新页面
let mainComponentsPage = figma.root.findOne(node => node.type === "PAGE" && node.name === "main components");
let hasMovedComponents = false;
if (!mainComponentsPage) {
  mainComponentsPage = figma.createPage();
  mainComponentsPage.name = "main components";
}

// 选中所有的 main components 组件，并移动到新创建的 page 中
let mainComponents = figma.currentPage.findAll(node => node.type === "COMPONENT" || node.type === "COMPONENT_SET");
let componentsToMove = [];
let variantSetsToMove = [];
for (let component of mainComponents) {
  if (component.type === "COMPONENT_SET" && component.children.length > 0) {
    // 删除原来的组件集
    component.remove();
    variantSetsToMove.push(component);
  } else if (component.type === "COMPONENT") {
    // 判断是否属于一个组件集
    let parent = component.parent;
    if (parent && parent.type === "COMPONENT_SET") {
      // 如果属于一个组件集，就删除并移动整个组件集
      if (!variantSetsToMove.includes(parent)) {
        parent.remove();
        variantSetsToMove.push(parent);
        hasMovedComponents = true;
      }
    } else {
      // 如果不属于一个组件集，就单独移动，并在原来的位置创建一个实例

      // 判断原来的组件是否在一个 Frame 中或 Group 中
      let frameOrGroup = component.parent;
      if (frameOrGroup && (frameOrGroup.type === "FRAME" || frameOrGroup.type === "GROUP")) {
        // 创建实例，并添加到 Frame 或 Group 的子节点中
        let instance = component.createInstance();
        frameOrGroup.appendChild(instance); // 使用 appendChild 方法

        let relativeTransformX, relativeTransformY;
        if (frameOrGroup.type === "FRAME") {
          // 获取组件和 Frame 的绝对坐标
          let componentX = component.absoluteTransform[0][2];
          let componentY = component.absoluteTransform[1][2];
          let frameX = frameOrGroup.absoluteTransform[0][2];
          let frameY = frameOrGroup.absoluteTransform[1][2];

          // 设置实例的相对坐标，要减去 Frame 的绝对坐标
          relativeTransformX = componentX - frameX;
          relativeTransformY = componentY - frameY;

          // 使用 resize 方法设置实例的宽度和高度
          instance.resize(component.width, component.height);

        } else if (frameOrGroup.type === "GROUP") {
          // 获取组件和 Group 的相对坐标
          let groupParent = frameOrGroup.parent;
          let componentPosition = component.relativeTransform;
          let groupPosition = frameOrGroup.relativeTransform;

          // 设置实例的相对坐标
          relativeTransformX = componentPosition[0][2] - groupPosition[0][2];
          relativeTransformY = componentPosition[1][2] - groupPosition[1][2];

          // 使用 resize 方法设置实例的宽度和高度
          instance.resize(component.width, component.height);
        }

        // 设置实例的相对坐标
        instance.relativeTransform = [[1, 0, relativeTransformX], [0, 1, relativeTransformY]];

      } else {
        // 创建实例，并添加到父节点中
        let instance = component.createInstance(parent);

        // 获取组件的绝对坐标
        let absoluteX = component.absoluteTransform[0][2];
        let absoluteY = component.absoluteTransform[1][2];

        // 设置实例的相对坐标
        instance.relativeTransform = [[1, 0, absoluteX], [0, 1, absoluteY]];

        // 使用 resize 方法设置实例的宽度和高度
        instance.resize(component.width, component.height);

      }

      componentsToMove.push(component);
      hasMovedComponents = true;
    }
  }
}

if (hasMovedComponents) {
  for (let component of componentsToMove) {
    mainComponentsPage.appendChild(component);
  }
  for (let variantSet of variantSetsToMove) {
    mainComponentsPage.appendChild(variantSet);
  }
  mainComponentsPage.selection = componentsToMove.concat(variantSetsToMove);
  // 切换到新的 page
  figma.currentPage = mainComponentsPage;
} else {
  figma.notify("No main components or Variants found in the current page.");
}