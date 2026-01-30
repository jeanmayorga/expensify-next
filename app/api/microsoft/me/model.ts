/**
 * Microsoft Graph API user (me) response
 * @see https://learn.microsoft.com/en-us/graph/api/user-get
 */
export interface MicrosoftUser {
  "@odata.context": string;
  id: string;
  userPrincipalName: string;
  displayName: string;
  surname: string;
  givenName: string;
  preferredLanguage: string;
  mail: string | null;
  mobilePhone: string | null;
  jobTitle: string | null;
  officeLocation: string | null;
  businessPhones: string[];
}
