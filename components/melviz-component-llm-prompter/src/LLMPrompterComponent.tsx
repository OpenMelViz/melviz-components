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
import { ComponentController, DataSet } from "melviz-component-api";
import { useState, useEffect } from "react";
import OllamaRequest from "./OllamaRequest";
import "./LLMPrompterComponent.css";
import { OllamaResponse } from "./OllamaResponse";
import Markdown from "react-markdown";

const BASE_URL_PROP = "baseUrl"
const PROMPT_PROP = "prompt";
const MODEL_PROP = "model";
const SHOW_PROMPT_PROP = "showPrompt";
const SHOW_DATA_PROP = "showData";
const AUTO_RUN_PROP = "autoRun";
const RESPONSE_TITLE_PROP = "responseTitle";

const DEFAULT_SERVER_URL = "http://localhost:11434";
const DEFAULT_MODEL = "llama3.2";
const DATA_PLACEHOLDER = "$data";
const DEFAULT_RESPONSE_TITLE = "LLM Response";


// prompt, autoPtompy, cache, 

interface Props {
  controller: ComponentController;
}

interface ViewData {
  url: string;
  model: string;
  prompt: string;
  initialPrompt: string;
  waitDataSet: boolean;
  showPrompt: boolean;
  showData: boolean;
  shouldRunNow: boolean;
  isAutoRun: boolean;
  responseTitle: string | undefined,
  dataSetTextContent: string | undefined;
  llmResponse: string | undefined;
}
export function LLMPrompterComponent(props: Props) {
  const [viewData, setViewData] = useState<ViewData>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    if (!viewData || viewData.llmResponse || viewData.waitDataSet || !viewData.shouldRunNow) {
      return;
    }
    const req = new OllamaRequest(viewData.model, viewData.prompt);
    const reqContent = JSON.stringify(req);
    fetch(`${viewData?.url}/api/generate`, {
      method: 'POST',
      body: reqContent
    })
      .then(req => req.text())
      .then(v => {
        const response: OllamaResponse = JSON.parse(v);
        if (response.error) {
          const errorMessage = "There was an error: " + response.error;
          console.error();
          props.controller.requireConfigurationFix(response.error);
          setErrorMessage(errorMessage);
        } else {
          props.controller.configurationOk();
          setErrorMessage(undefined);
          setViewData({
            ...viewData,
            waitDataSet: true,
            llmResponse: response.response
          });

        }
      })

  }, [viewData, props.controller]);

  const runPrompt = React.useCallback(() => {
    setViewData({
      ...viewData!,
      shouldRunNow: true
    });
  }, [viewData])

  useEffect(() => {
    props.controller.setOnInit((params: Map<string, any>) => {
      const prompt = params.get(PROMPT_PROP) as string;
      let serverUrl = params.get(BASE_URL_PROP) as string;
      const model = params.get(MODEL_PROP) as string;
      const showPrompt = params.get(SHOW_PROMPT_PROP) === "true";
      const showData = params.get(SHOW_DATA_PROP) === "true";
      const autoRun = params.get(AUTO_RUN_PROP) === "true";
      const responseTitle = params.get(RESPONSE_TITLE_PROP);
      if (!prompt) {
        const errorMessage = "Property 'prompt' is missing!";
        props.controller.requireConfigurationFix(errorMessage);
        setErrorMessage(errorMessage);
        return;
      }
      setErrorMessage(undefined);
      if (!serverUrl) {
        console.log("Server URL not provided, using: " + DEFAULT_SERVER_URL);
      } else {
        if (serverUrl.endsWith("/")) {
          serverUrl = serverUrl.substring(0, serverUrl.length - 1);
        }
      }

      if (!model) {
        console.log("Model not provided, using: " + DEFAULT_MODEL);
      }
      props.controller.configurationOk();
      setViewData({
        url: serverUrl || DEFAULT_SERVER_URL,
        model: model || DEFAULT_MODEL,
        prompt: prompt,
        responseTitle: responseTitle || DEFAULT_RESPONSE_TITLE,
        initialPrompt: prompt,
        llmResponse: undefined,
        dataSetTextContent: undefined,
        showData: showData,
        showPrompt: showPrompt,
        shouldRunNow: autoRun,
        isAutoRun: autoRun,
        waitDataSet: prompt.indexOf(DATA_PLACEHOLDER) !== -1
      });
    });
    props.controller.setOnDataSet((_dataset: DataSet) => {
      if (viewData?.waitDataSet ||
        // in case of new dataset generated by a filter
        viewData?.dataSetTextContent) {
        let dataSetTextContent = "";
        _dataset.columns.forEach((cl, i) => dataSetTextContent += cl.name + ",");
        dataSetTextContent = dataSetTextContent.substring(0, dataSetTextContent.length - 1);
        dataSetTextContent += "\n";
        _dataset.data.forEach((row, i) => {
          row.forEach((r, j) => {
            dataSetTextContent += r + ","
          });
          dataSetTextContent = dataSetTextContent.substring(0, dataSetTextContent.length - 1);
          dataSetTextContent += "\n";
        });

        setViewData({
          ...viewData,
          waitDataSet: false,
          llmResponse: undefined,
          dataSetTextContent: dataSetTextContent,
          prompt: viewData.initialPrompt.replace(DATA_PLACEHOLDER, dataSetTextContent),
          shouldRunNow: viewData.isAutoRun
        });
      }
    });
  }, [props.controller, viewData]);

  return (
    <>
      {(errorMessage) ? <label className="error-label" >
        <span className="error-message">{errorMessage}</span>
      </label>
        :
        <div>
          {viewData?.showPrompt && <small><strong>Prompt:</strong> <em>{viewData?.initialPrompt}</em></small>}
          {viewData?.showData && viewData?.dataSetTextContent &&
            <p>
              <strong><small>Data</small></strong> <br />
              <textarea className="dataSetContentContainer" value={viewData?.dataSetTextContent} disabled></textarea>
            </p>
          }
          {viewData?.llmResponse &&
            <div style={{
              width: "100%",
              height: "100vh",
              overflow: "auto"
            }}>
              <div className="responseContainer">
                {viewData?.responseTitle && <h5>{viewData?.responseTitle}</h5>}
                <Markdown>{viewData?.llmResponse}</Markdown>
              </div>
            </div>
          }
          {!viewData?.shouldRunNow &&
            <div>
              <button onClick={runPrompt}>&#9658; &#x1F916;</button>
            </div>
          }
          {!viewData?.llmResponse && viewData?.shouldRunNow && <div className="loader"></div>}
        </div>
      }
    </>
  );
}
