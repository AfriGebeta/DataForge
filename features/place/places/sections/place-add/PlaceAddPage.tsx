"use client";

import { useEffect, useState } from "react";
import { createPlace } from "../../api";
import type {
  AccessType,
  ContactType,
  CreateAttributeRequest,
  CreateContactRequest,
  CreateOpeningHoursRequest,
  CreatePlaceRequest,
  GeometryType,
  PlaceType,
  ReviewStatus,
} from "../../types";
import {
  ACCESS_TYPES,
  ATTRIBUTE_VALUE_TYPES,
  CONTACT_TYPES,
  GEOCODE_METHODS,
  PLACE_TYPES,
  WEEKDAYS,
} from "@/features/verification/shared/types";
import { fetchParentCategories, getLocalizedName } from "@/features/category/categories/api";
import type { Category } from "@/features/category/categories/types";
import { GlassCard } from "@/features/shared/GlassCard";

type NameDraft = { languageCode: string; name: string };
type AttributeDraft = { key: string; value: string; valueType: CreateAttributeRequest["valueType"] };

export default function PlaceAddPage() {
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => { void fetchParentCategories().then(setCategories); }, []);

  // Core fields
  const [placeType, setPlaceType] = useState<PlaceType>("POI");
  const [accessType, setAccessType] = useState<AccessType>("PUBLIC");
  const [categoryId, setCategoryId] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [geometryType, setGeometryType] = useState<GeometryType>("Point");
  const [geocodeMethod, setGeocodeMethod] = useState("");
  const [geocodeConfidence, setGeocodeConfidence] = useState("");
  const [areaSqMeters, setAreaSqMeters] = useState("");
  const [elevationMeters, setElevationMeters] = useState("");
  const [buildingLevels, setBuildingLevels] = useState("");
  const [establishedAt, setEstablishedAt] = useState("");
  const [bboxMinLat, setBboxMinLat] = useState("");
  const [bboxMinLng, setBboxMinLng] = useState("");
  const [bboxMaxLat, setBboxMaxLat] = useState("");
  const [bboxMaxLng, setBboxMaxLng] = useState("");
  const [areaCoordinatesStr, setAreaCoordinatesStr] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("COMPLETED");
  const [reviewReason, setReviewReason] = useState("");

  // Names — languageCode -> name text. The backend infers primary/nameType.
  const [names, setNames] = useState<NameDraft[]>([{ languageCode: "en", name: "" }]);

  // Address
  const [countryIso2, setCountryIso2] = useState("ET");
  const [streetNameEn, setStreetNameEn] = useState("");
  const [streetNameAm, setStreetNameAm] = useState("");
  const [streetNumber, setStreetNumber] = useState("");

  // Contacts
  const [contacts, setContacts] = useState<CreateContactRequest[]>([]);

  // Opening hours
  const [openingHours, setOpeningHours] = useState<CreateOpeningHoursRequest[]>([]);

  // Attributes
  const [attributes, setAttributes] = useState<AttributeDraft[]>([]);

  const addName = () => setNames([...names, { languageCode: "am", name: "" }]);
  const removeName = (i: number) => setNames(names.filter((_, idx) => idx !== i));
  const updateName = (i: number, field: keyof NameDraft, value: string) =>
    setNames(names.map((n, idx) => (idx === i ? { ...n, [field]: value } : n)));

  const addContact = () => setContacts([...contacts, { type: "PHONE", value: "", label: "" }]);
  const removeContact = (i: number) => setContacts(contacts.filter((_, idx) => idx !== i));
  const updateContact = (i: number, field: keyof CreateContactRequest, value: string) =>
    setContacts(contacts.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));

  const addHours = () => setOpeningHours([...openingHours, { weekday: 1, opensAt: "08:00", closesAt: "17:00", isClosed: false }]);
  const removeHours = (i: number) => setOpeningHours(openingHours.filter((_, idx) => idx !== i));
  const updateHours = (i: number, field: keyof CreateOpeningHoursRequest, value: string | number | boolean) =>
    setOpeningHours(openingHours.map((h, idx) => (idx === i ? { ...h, [field]: value } : h)));

  const addAttribute = () => setAttributes([...attributes, { key: "", value: "", valueType: "STRING" }]);
  const removeAttribute = (i: number) => setAttributes(attributes.filter((_, idx) => idx !== i));
  const updateAttribute = (i: number, field: keyof AttributeDraft, value: string) =>
    setAttributes(attributes.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameMap: Record<string, string> = {};
    for (const n of names) {
      if (n.languageCode.trim() && n.name.trim()) nameMap[n.languageCode.trim()] = n.name.trim();
    }
    if (Object.keys(nameMap).length === 0) { setError("At least one name is required."); return; }
    if (!latitude || !longitude) { setError("Latitude and longitude are required."); return; }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) { setError("Latitude must be between -90 and 90."); return; }
    if (isNaN(lng) || lng < -180 || lng > 180) { setError("Longitude must be between -180 and 180."); return; }

    let parsedAreaCoordinates: number[][] | undefined;
    if (areaCoordinatesStr.trim()) {
      try {
        parsedAreaCoordinates = JSON.parse(areaCoordinatesStr);
        if (!Array.isArray(parsedAreaCoordinates)) throw new Error();
      } catch {
        setError("Area Coordinates must be a valid JSON array of coordinate arrays (e.g., [[9.0, 38.0], ...]).");
        return;
      }
    }

    const validContacts = contacts.filter((c) => c.value.trim());
    const validAttributes = attributes.filter((a) => a.key.trim());

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    const request: CreatePlaceRequest = {
      placeType,
      accessType,
      latitude: lat,
      longitude: lng,
      geometryType,
      isActive,
      isVisible,
      reviewStatus,
      names: nameMap,
      ...(categoryId ? { categoryId } : {}),
      address: {
        countryIso2,
        ...(streetNameEn || streetNameAm ? { streetName: { ...(streetNameEn ? { en: streetNameEn } : {}), ...(streetNameAm ? { am: streetNameAm } : {}) } } : {}),
        ...(streetNumber ? { streetNumber } : {}),
      },
      ...(validContacts.length > 0 ? { contacts: validContacts } : {}),
      ...(openingHours.length > 0 ? { openingHours } : {}),
      ...(validAttributes.length > 0
        ? {
            attributes: validAttributes.map((a) => ({
              key: a.key,
              valueType: a.valueType,
              value: a.valueType === "BOOLEAN" ? a.value === "true" : a.valueType === "NUMBER" ? Number(a.value) : a.value,
            })),
          }
        : {}),
      ...(parsedAreaCoordinates ? { areaCoordinates: parsedAreaCoordinates } : {}),
      ...(bboxMinLat ? { bboxMinLat: parseFloat(bboxMinLat) } : {}),
      ...(bboxMinLng ? { bboxMinLng: parseFloat(bboxMinLng) } : {}),
      ...(bboxMaxLat ? { bboxMaxLat: parseFloat(bboxMaxLat) } : {}),
      ...(bboxMaxLng ? { bboxMaxLng: parseFloat(bboxMaxLng) } : {}),
      ...(areaSqMeters ? { areaSqMeters: parseFloat(areaSqMeters) } : {}),
      ...(elevationMeters ? { elevationMeters: parseFloat(elevationMeters) } : {}),
      ...(buildingLevels ? { buildingLevels: parseInt(buildingLevels, 10) } : {}),
      ...(establishedAt ? { establishedAt: new Date(establishedAt).toISOString() } : {}),
      ...(geocodeMethod ? { geocodeMethod } : {}),
      ...(geocodeConfidence ? { geocodeConfidence: parseFloat(geocodeConfidence) } : {}),
      ...(reviewReason ? { reviewReason } : {}),
    };

    try {
      const created = await createPlace(request);
      setFeedback(`Place created successfully — ID: ${created.id}`);
      // Reset form
      setNames([{ languageCode: "en", name: "" }]);
      setCategoryId(""); setLatitude(""); setLongitude(""); setContacts([]); setOpeningHours([]); setAttributes([]);
      setStreetNameEn(""); setStreetNameAm(""); setStreetNumber(""); setReviewReason("");
      setAreaSqMeters(""); setElevationMeters(""); setBuildingLevels(""); setEstablishedAt("");
      setBboxMinLat(""); setBboxMinLng(""); setBboxMaxLat(""); setBboxMaxLng(""); setAreaCoordinatesStr("");
      setGeocodeMethod(""); setGeocodeConfidence("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to create place.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="view active relative min-h-full overflow-hidden bg-[color:var(--surface-0)] px-6 pt-10 pb-8 md:px-10 md:pt-14 md:pb-10 xl:px-14 xl:pt-16 xl:pb-12" id="v-place-add">
      <div className="aurora-bg" aria-hidden />
      <div className="relative z-10 flex flex-col gap-6">
      <div className="page-hd">
        <h2>Add Place</h2>
        <p>Create a new place via <span className="mono">POST /api/v1/places</span>.</p>
      </div>

      {feedback ? <div className="category-feedback">{feedback}</div> : null}
      {error ? <div className="category-inline-error">{error}</div> : null}

      <form onSubmit={handleSubmit}>
        {/* ── Core Fields ── */}
        <GlassCard flat className="card" style={{ marginBottom: 14 }}>
          <div className="ch"><span className="ct">Core Information</span></div>
          <div className="fr">
            <div className="fg">
              <label className="fl">Place Type <span>*</span></label>
              <select className="glass-select" value={placeType} onChange={(e) => setPlaceType(e.target.value as PlaceType)}>
                {PLACE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                Geographic kind (POI, road, administrative area…). What kind of place it is for end users (cafe, hotel…) is the Category below.
              </p>
            </div>
            <div className="fg">
              <label className="fl">Access Type <span>*</span></label>
              <select className="glass-select" value={accessType} onChange={(e) => setAccessType(e.target.value as AccessType)}>
                {ACCESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="fg">
            <label className="fl">Category</label>
            <select className="glass-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">— none —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{getLocalizedName(c, "en")}</option>)}
            </select>
          </div>
          <div className="fr">
            <div className="fg">
              <label className="fl">Latitude <span>*</span></label>
              <input type="number" step="any" placeholder="9.0222" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
            </div>
            <div className="fg">
              <label className="fl">Longitude <span>*</span></label>
              <input type="number" step="any" placeholder="38.7468" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
            </div>
            <div className="fg">
              <label className="fl">Geometry</label>
              <select className="glass-select" value={geometryType} onChange={(e) => setGeometryType(e.target.value as GeometryType)}>
                <option value="Point">Point</option><option value="Polygon">Polygon</option>
              </select>
            </div>
          </div>
          <div className="fr">
            <div className="fg"><label className="fl">BBox Min Lat</label><input type="number" step="any" placeholder="9.0220" value={bboxMinLat} onChange={(e) => setBboxMinLat(e.target.value)} /></div>
            <div className="fg"><label className="fl">BBox Min Lng</label><input type="number" step="any" placeholder="38.7460" value={bboxMinLng} onChange={(e) => setBboxMinLng(e.target.value)} /></div>
            <div className="fg"><label className="fl">BBox Max Lat</label><input type="number" step="any" placeholder="9.0225" value={bboxMaxLat} onChange={(e) => setBboxMaxLat(e.target.value)} /></div>
            <div className="fg"><label className="fl">BBox Max Lng</label><input type="number" step="any" placeholder="38.7478" value={bboxMaxLng} onChange={(e) => setBboxMaxLng(e.target.value)} /></div>
          </div>
          <div className="fg">
            <label className="fl">Area Coordinates (JSON)</label>
            <input type="text" placeholder="[[9.0222, 38.7468], [9.0223, 38.7469]]" value={areaCoordinatesStr} onChange={(e) => setAreaCoordinatesStr(e.target.value)} />
          </div>
          <div className="fr">
            <div className="fg"><label className="fl">Area (m²)</label><input type="number" step="any" placeholder="150.5" value={areaSqMeters} onChange={(e) => setAreaSqMeters(e.target.value)} /></div>
            <div className="fg"><label className="fl">Elevation (m)</label><input type="number" step="any" placeholder="2352.8" value={elevationMeters} onChange={(e) => setElevationMeters(e.target.value)} /></div>
            <div className="fg"><label className="fl">Building levels</label><input type="number" min="0" placeholder="2" value={buildingLevels} onChange={(e) => setBuildingLevels(e.target.value)} /></div>
          </div>
          <div className="fr">
            <div className="fg"><label className="fl">Geocode Method</label>
              <select className="glass-select" value={geocodeMethod} onChange={(e) => setGeocodeMethod(e.target.value)}>
                <option value="">—</option>
                {GEOCODE_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="fg"><label className="fl">Geocode Confidence (0–1)</label><input type="number" step="0.01" min="0" max="1" placeholder="0.95" value={geocodeConfidence} onChange={(e) => setGeocodeConfidence(e.target.value)} /></div>
          </div>
          <div className="fr">
            <div className="fg"><label className="fl">Established at</label><input type="datetime-local" value={establishedAt} onChange={(e) => setEstablishedAt(e.target.value)} /></div>
            <div className="fg">
              <label className="fl">Review Status</label>
              <select className="glass-select" value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value as ReviewStatus)}>
                <option value="COMPLETED">COMPLETED</option><option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
              </select>
            </div>
          </div>
          <div className="fg"><label className="fl">Review Reason</label><input type="text" placeholder="Manually verified by admin" value={reviewReason} onChange={(e) => setReviewReason(e.target.value)} /></div>
          <div className="fr">
            <div className="fg" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active</label>
            </div>
            <div className="fg" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label><input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} /> Visible</label>
            </div>
          </div>
        </GlassCard>

        {/* ── Names ── */}
        <GlassCard flat className="card" style={{ marginBottom: 14 }}>
          <div className="ch">
            <span className="ct">Names</span>
            <button type="button" className="btn sm" onClick={addName}><i className="ti ti-plus" />Add name</button>
          </div>
          <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "0 0 8px" }}>
            The backend picks the primary name (English, then Amharic, then alphabetically) automatically — there is no manual &ldquo;primary&rdquo; or &ldquo;type&rdquo; flag to set.
          </p>
          {names.map((n, i) => (
            <div key={i} className="fr" style={{ alignItems: "flex-end" }}>
              <div className="fg" style={{ width: 100 }}>
                <label className="fl">Lang code</label>
                <input type="text" placeholder="en" value={n.languageCode} onChange={(e) => updateName(i, "languageCode", e.target.value)} />
              </div>
              <div className="fg"><label className="fl">Name <span>*</span></label><input type="text" placeholder="Tomoca Coffee" value={n.name} onChange={(e) => updateName(i, "name", e.target.value)} /></div>
              {names.length > 1 && <button type="button" className="btn sm d" onClick={() => removeName(i)} style={{ marginBottom: 8 }}><i className="ti ti-x" /></button>}
            </div>
          ))}
        </GlassCard>

        {/* ── Address ── */}
        <GlassCard flat className="card" style={{ marginBottom: 14 }}>
          <div className="ch"><span className="ct">Address</span></div>
          <div className="fr">
            <div className="fg" style={{ width: 80 }}><label className="fl">Country</label><input type="text" maxLength={2} placeholder="ET" value={countryIso2} onChange={(e) => setCountryIso2(e.target.value.toUpperCase())} /></div>
            <div className="fg"><label className="fl">Street (EN)</label><input type="text" placeholder="Wawel St" value={streetNameEn} onChange={(e) => setStreetNameEn(e.target.value)} /></div>
            <div className="fg"><label className="fl">Street (AM)</label><input type="text" placeholder="ዋዌል ጎዳና" value={streetNameAm} onChange={(e) => setStreetNameAm(e.target.value)} /></div>
            <div className="fg" style={{ width: 80 }}><label className="fl">Number</label><input type="text" placeholder="123" value={streetNumber} onChange={(e) => setStreetNumber(e.target.value)} /></div>
          </div>
        </GlassCard>

        {/* ── Contacts ── */}
        <GlassCard flat className="card" style={{ marginBottom: 14 }}>
          <div className="ch"><span className="ct">Contacts</span><button type="button" className="btn sm" onClick={addContact}><i className="ti ti-plus" />Add</button></div>
          {contacts.length === 0 && <div style={{ padding: "8px 0", color: "var(--text-muted)", fontSize: 12 }}>No contacts added.</div>}
          {contacts.map((c, i) => (
            <div key={i} className="fr" style={{ alignItems: "flex-end" }}>
              <div className="fg" style={{ width: 140 }}><label className="fl">Type</label>
                <select className="glass-select" value={c.type} onChange={(e) => updateContact(i, "type", e.target.value as ContactType)}>
                  {CONTACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="fg"><label className="fl">Value</label><input type="text" placeholder="+251911234567" value={c.value} onChange={(e) => updateContact(i, "value", e.target.value)} /></div>
              <div className="fg"><label className="fl">Label</label><input type="text" placeholder="Main Branch" value={c.label ?? ""} onChange={(e) => updateContact(i, "label", e.target.value)} /></div>
              <button type="button" className="btn sm d" onClick={() => removeContact(i)} style={{ marginBottom: 8 }}><i className="ti ti-x" /></button>
            </div>
          ))}
        </GlassCard>

        {/* ── Opening Hours ── */}
        <GlassCard flat className="card" style={{ marginBottom: 14 }}>
          <div className="ch"><span className="ct">Opening Hours</span><button type="button" className="btn sm" onClick={addHours}><i className="ti ti-plus" />Add</button></div>
          {openingHours.length === 0 && <div style={{ padding: "8px 0", color: "var(--text-muted)", fontSize: 12 }}>No hours set.</div>}
          {openingHours.map((h, i) => (
            <div key={i} className="fr" style={{ alignItems: "flex-end" }}>
              <div className="fg" style={{ width: 130 }}><label className="fl">Day</label>
                <select className="glass-select" value={h.weekday} onChange={(e) => updateHours(i, "weekday", parseInt(e.target.value, 10))}>
                  {WEEKDAYS.map((d, idx) => <option key={d} value={idx}>{d}</option>)}
                </select>
              </div>
              <div className="fg"><label className="fl">Opens</label><input type="time" value={h.opensAt} onChange={(e) => updateHours(i, "opensAt", e.target.value)} /></div>
              <div className="fg"><label className="fl">Closes</label><input type="time" value={h.closesAt} onChange={(e) => updateHours(i, "closesAt", e.target.value)} /></div>
              <div className="fg" style={{ width: 70, display: "flex", alignItems: "center" }}><label><input type="checkbox" checked={h.isClosed} onChange={(e) => updateHours(i, "isClosed", e.target.checked)} /> Closed</label></div>
              <button type="button" className="btn sm d" onClick={() => removeHours(i)} style={{ marginBottom: 8 }}><i className="ti ti-x" /></button>
            </div>
          ))}
        </GlassCard>

        {/* ── Attributes ── */}
        <GlassCard flat className="card" style={{ marginBottom: 14 }}>
          <div className="ch"><span className="ct">Attributes</span><button type="button" className="btn sm" onClick={addAttribute}><i className="ti ti-plus" />Add</button></div>
          {attributes.length === 0 && <div style={{ padding: "8px 0", color: "var(--text-muted)", fontSize: 12 }}>No attributes.</div>}
          {attributes.map((a, i) => (
            <div key={i} className="fr" style={{ alignItems: "flex-end" }}>
              <div className="fg"><label className="fl">Key</label><input type="text" placeholder="has_wifi" value={a.key} onChange={(e) => updateAttribute(i, "key", e.target.value)} /></div>
              <div className="fg"><label className="fl">Value</label><input type="text" placeholder="true" value={a.value} onChange={(e) => updateAttribute(i, "value", e.target.value)} /></div>
              <div className="fg" style={{ width: 120 }}><label className="fl">Type</label>
                <select className="glass-select" value={a.valueType} onChange={(e) => updateAttribute(i, "valueType", e.target.value)}>
                  {ATTRIBUTE_VALUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <button type="button" className="btn sm d" onClick={() => removeAttribute(i)} style={{ marginBottom: 8 }}><i className="ti ti-x" /></button>
            </div>
          ))}
        </GlassCard>

        <div className="category-form-actions">
          <button type="submit" className="btn p" disabled={submitting}>
            <i className="ti ti-map-pin-plus" />
            {submitting ? "Creating…" : "Create Place"}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
