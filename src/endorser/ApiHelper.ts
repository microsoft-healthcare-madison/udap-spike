import fetch from "cross-fetch";
import {Headers} from "cross-fetch";
import fhir4 from "fhir/r4";

export interface ApiResponse<T> {
  statusCode?: number;
  statusText?: string;
  body?: string;
  value?: T;
  outcome?: fhir4.OperationOutcome;
  error?: any;
}

export class ApiHelper {
  static async apiGet<T>(
    url: string,
    authHeader?: string
  ): Promise<ApiResponse<T>> {
    try {
      let headers: Headers = new Headers();
      headers.append("Accept", "application/json");
      if (authHeader) {
        headers.append("Authorization", authHeader);
      }

      let response: Response = await fetch(url, {
        method: "GET",
        headers: headers,
      });

      let body: string = await response.text();
      let typed: T | undefined = undefined;

      // attempt Typed parse
      try {
        typed = JSON.parse(body);
      } catch (parseError) {
        // ignore
      }
      return {
        statusCode: response.status,
        statusText: response.statusText,
        body: body,
        value: typed,
      };
    } catch (err) {
      return {
        error: err,
      };
    }
  }

  static async apiGetFhir<T extends fhir4.Resource>(
    url: string,
    authHeader?: string
  ): Promise<ApiResponse<T>> {
    try {
      let headers: Headers = new Headers();
      headers.append("Accept", "application/fhir+json");
      if (authHeader) {
        headers.append("Authorization", authHeader);
      }

      let response: Response = await fetch(url, {
        method: "GET",
        headers: headers,
      });
      let body: string = await response.text();
      let typed: T | undefined = undefined;
      let outcome: fhir4.OperationOutcome | undefined = undefined;

      // attempt typed parses
      try {
        let parsed: any = JSON.parse(body);
        if (parsed.resourceType && parsed.resourceType !== "OperationOutcome") {
          typed = parsed;
        }
        if (parsed.resourceType === "OperationOutcome") {
          outcome = parsed;
        }
      } catch (parseError) {
        // ignore
      }

      return {
        statusCode: response.status,
        statusText: response.statusText,
        body: body,
        value: typed,
        outcome: outcome,
      };
    } catch (err) {
      return {
        error: err,
      };
    }
  }

  static async apiPost<T>(
    url: string,
    data: T | undefined,
    authHeader?: string
  ): Promise<ApiResponse<T>> {
    try {
      let headers: Headers = new Headers();
      headers.append("Accept", "application/json");
      headers.append("Content-Type", "application/json");
      if (authHeader) {
        headers.append("Authorization", authHeader);
      }
      let response: Response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: data ? JSON.stringify(data) : "",
      });
      let body: string = await response.text();
      let typed: T | undefined = undefined;

      // attempt Typed parse
      try {
        typed = JSON.parse(body);
      } catch (parseError) {
        // ignore
      }
      return {
        statusCode: response.status,
        statusText: response.statusText,
        body: body,
        value: typed,
      };
    } catch (err) {
      return {
        error: err,
      };
    }
  }

  static async apiPostFhir<T extends fhir4.Resource>(
    url: string,
    data: T,
    authHeader?: string,
    preferHeader?: string
  ): Promise<ApiResponse<T>> {
    try {
      let headers: Headers = new Headers();
      headers.append("Accept", "application/fhir+json");
      headers.append("Content-Type", "application/fhir+json;charset=utf-8");
      if (authHeader) {
        headers.append("Authorization", authHeader);
      }
      if (preferHeader) {
        headers.append("Prefer", `return=${preferHeader}`);
      } else {
        headers.append("Prefer", "return=representation");
      }
      let response: Response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data),
      });

      let location: string | null = response.headers.has("Location")
        ? response.headers.get("Location")
        : null;
      let body: string = await response.text();
      let typed: T | undefined = undefined;
      let outcome: fhir4.OperationOutcome | undefined = undefined;

      // attempt typed parse
      try {
        let parsed: any = JSON.parse(body);
        if (
          parsed &&
          parsed.resourceType &&
          parsed.resourceType !== "OperationOutcome"
        ) {
          typed = parsed;
        }
        if (parsed && parsed.resourceType === "OperationOutcome") {
          outcome = parsed;
        }
      } catch (parseError) {
        // ignore
      }

      // check for not having data and having a location header
      if (!typed && location) {
        // perform our get
        try {
          let getResponse: ApiResponse<T> = await this.apiGetFhir<T>(
            location!,
            authHeader
          );
          typed = getResponse.value;
        } catch (getError) {
          // ignore errors here for now
        }
      }

      // return our info
      return {
        statusCode: response.status,
        statusText: response.statusText,
        body: body,
        value: typed,
        outcome: outcome,
      };
    } catch (err) {
      return {
        error: err,
      };
    }
  }

  static async apiPutFhir<T extends fhir4.Resource>(
    url: string,
    data: T,
    authHeader?: string,
    preferHeader?: string
  ): Promise<ApiResponse<T>> {
    try {
      let headers: Headers = new Headers();
      headers.append("Accept", "application/fhir+json");
      headers.append("Content-Type", "application/fhir+json;charset=utf-8");
      if (authHeader) {
        headers.append("Authorization", authHeader);
      }
      if (preferHeader) {
        headers.append("Prefer", `return=${preferHeader}`);
      } else {
        headers.append("Prefer", "return=representation");
      }
      let response: Response = await fetch(url, {
        method: "PUT",
        headers: headers,
        body: JSON.stringify(data),
      });
      let body: string = await response.text();
      let typed: T | undefined = undefined;
      let outcome: fhir4.OperationOutcome | undefined = undefined;

      // attempt typed parse
      try {
        let parsed: any = JSON.parse(body);
        if (parsed.resourceType && parsed.resourceType !== "OperationOutcome") {
          typed = parsed;
        }
        if (parsed.resourceType === "OperationOutcome") {
          outcome = parsed;
        }
      } catch (parseError) {
        // ignore
      }

      // check for not having data and having a location header
      if (!typed && response.headers.has("Location")) {
        // grab the location
        let location: string = response.headers.get("Location")!;

        // perform our get
        try {
          let getResponse: ApiResponse<T> = await this.apiGetFhir<T>(
            location,
            authHeader
          );
          typed = getResponse.value;
        } catch (getError) {
          // ignore errors here for now
        }
      }

      return {
        statusCode: response.status,
        statusText: response.statusText,
        body: body,
        value: typed,
        outcome: outcome,
      };
    } catch (err) {
      return {
        error: err,
      };
    }
  }

  static async apiPut<T>(
    url: string,
    jsonData: string,
    authHeader?: string
  ): Promise<ApiResponse<T>> {
    try {
      let headers: Headers = new Headers();
      headers.append("Accept", "application/json");
      headers.append("Content-Type", "application/json");
      if (authHeader) {
        headers.append("Authorization", authHeader);
      }
      let response: Response = await fetch(url, {
        method: "PUT",
        headers: headers,
        body: jsonData,
      });
      let body: string = await response.text();
      let typed: T | undefined = undefined;

      // attempt Typed parse
      try {
        typed = JSON.parse(body);
      } catch (parseError) {
        // ignore
      }
      return {
        statusCode: response.status,
        statusText: response.statusText,
        body: body,
        value: typed,
      };
    } catch (err) {
      return {
        error: err,
      };
    }
  }

  static async apiDelete<T>(
    url: string,
    authHeader?: string
  ): Promise<ApiResponse<T>> {
    try {
      let headers: Headers = new Headers();
      headers.append("Accept", "application/json");
      headers.append("Content-Type", "application/json");
      if (authHeader) {
        headers.append("Authorization", authHeader);
      }
      let response: Response = await fetch(url, {
        method: "DELETE",
        headers: headers,
      });
      let body: string = await response.text();
      let typed: T | undefined = undefined;

      // attempt Typed parse
      try {
        typed = JSON.parse(body);
      } catch (parseError) {
        // ignore
      }

      return {
        statusCode: response.status,
        statusText: response.statusText,
        body: body,
        value: typed,
      };
    } catch (err) {
      return {
        error: err,
      };
    }
  }

  static async apiDeleteFhir<T extends fhir4.Resource>(
    url: string,
    authHeader?: string,
    preferHeader?: string
  ): Promise<ApiResponse<T>> {
    try {
      let headers: Headers = new Headers();
      headers.append("Accept", "application/fhir+json");
      headers.append("Content-Type", "application/fhir+json;charset=utf-8");
      if (authHeader) {
        headers.append("Authorization", authHeader);
      }
      if (preferHeader) {
        headers.append("Prefer", `return=${preferHeader}`);
      } else {
        headers.append("Prefer", "return=representation");
      }
      let response: Response = await fetch(url, {
        method: "DELETE",
        headers: headers,
      });
      let body: string = await response.text();
      let typed: T | undefined = undefined;
      let outcome: fhir4.OperationOutcome | undefined = undefined;

      // attempt Typed parse
      try {
        let parsed: any = JSON.parse(body);
        if (parsed.resourceType && parsed.resourceType !== "OperationOutcome") {
          typed = parsed;
        }
        if (parsed.resourceType === "OperationOutcome") {
          outcome = parsed;
        }
      } catch (parseError) {
        // ignore
      }

      return {
        statusCode: response.status,
        statusText: response.statusText,
        body: body,
        value: typed,
        outcome: outcome,
      };
    } catch (err) {
      return {
        error: err,
      };
    }
  }
}
