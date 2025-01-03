/*
 
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from "react";

export interface DevPaneProps {
  sendInit: () => void;
  sendDataSet: () => void;
}
export function ComponentDevPane(props: DevPaneProps) {
  return (
    <div style={{ position: "absolute", zIndex: 10, bottom: 0, width: "100%", height: "30px" }}>
      <button onClick={props.sendInit}>INIT</button>
      <button onClick={props.sendDataSet}>DATASET</button>
    </div>
  );
}
