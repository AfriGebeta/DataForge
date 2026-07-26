"use client";

import { useState } from "react";
import { createPlace } from "../../api";
import type { CreatePlaceRequest, PlaceName, PlaceContact, PlaceOpeningHour, PlaceAttribute, PlaceType, AccessType, GeometryType, ReviewStatus } from "../../types";
import { GlassCard } from "@/features/shared/GlassCard";

const WEEKDAY_LABELS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function PlaceAddPage() {
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Core fields
  const [placeType, setPlaceType] = useState<PlaceType>("POI");
  const [accessType, setAccessType] = useState<AccessType>("PUBLIC");
  const [categoryId, setCategoryId] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [geometryType, setGeometryType] = useState<GeometryType>("Point");
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
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("PENDING");
  const [reviewReason, setReviewReason] = useState("");

  // Names
  const [names, setNames] = useState<Omit<PlaceName, "id" | "displayOrder">[]>([
    { languageCode: "en", name: "", nameType: "PRIMARY", isPrimary: true },
  ]);

  // Address
  const [countryIso2, setCountryIso2] = useState("ET");
  const [streetNameEn, setStreetNameEn] = useState("");
  const [streetNameAm, setStreetNameAm] = useState("");
  const [streetNumber, setStreetNumber] = useState("");

  // Contacts
  const [contacts, setContacts] = useState<Omit<PlaceContact, "id">[]>([]);

  // Opening hours
  const [openingHours, setOpeningHours] = useState<Omit<PlaceOpeningHour, "id">[]>([]);

  // Attributes
  const [attributes, setAttributes] = useState<Omit<PlaceAttribute, "id">[]>([]);

  const addName = () => setNames([...names, { languageCode: "am", name: "", nameType: "LOCAL", isPrimary: false }]);
  const removeName = (i: number) => setNames(names.filter((_, idx) => idx !== i));
  const updateName = (i: number, field: string, value: string | boolean) => setNames(names.map((n, idx) => idx === i ? { ...n, [field]: value } : n));

  const addContact = () => setContacts([...contacts, { type: "PHONE", value: "", label: "" }]);
  const removeContact = (i: number) => setContacts(contacts.filter((_, idx) => idx !== i));
  const updateContact = (i: number, field: string, value: string) => setContacts(contacts.map((c, idx) => idx === i ? { ...c, [field]: value } : c));

  const addHours = () => setOpeningHours([...openingHours, { weekday: 1, opensAt: "08:00", closesAt: "17:00", isClosed: false, is24Hours: false }]);
  const removeHours = (i: number) => setOpeningHours(openingHours.filter((_, idx) => idx !== i));
  const updateHours = (i: number, field: string, value: string | number | boolean) => setOpeningHours(openingHours.map((h, idx) => idx === i ? { ...h, [field]: value } : h));

  const addAttribute = () => setAttributes([...attributes, { key: "", value: "", valueType: "STRING" }]);
  const removeAttribute = (i: number) => setAttributes(attributes.filter((_, idx) => idx !== i));
  const updateAttribute = (i: number, field: string, value: unknown) => setAttributes(attributes.map((a, idx) => idx === i ? { ...a, [field]: value } : a));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!names.some((n) => n.name.trim())) { setError("At least one name is required."); return; }
    if (!latitude || !longitude) { setError("Latitude and longitude are required."); return; }
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) { setError("Latitude must be between -90 and 90."); return; }
    if (isNaN(lng) || lng < -180 || lng > 180) { setError("Longitude must be between -180 and 180."); return; }

    if (!categoryId.trim()) { setError("Category ID is required."); return; }
    
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

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    const request: CreatePlaceRequest = {
      placeType,
      accessType,
      categoryId: categoryId.trim(),
      latitude: lat,
      longitude: lng,
      geometryType,
      isActive,
      isVisible,
      reviewStatus,
      names: names.filter((n) => n.name.trim()),
      address: {
        countryIso2,
        ...(streetNameEn || streetNameAm ? { streetName: { ...(streetNameEn ? { en: streetNameEn } : {}), ...(streetNameAm ? { am: streetNameAm } : {}) } } : {}),
        ...(streetNumber ? { streetNumber } : {}),
      },
      ...(contacts.length > 0 ? { contacts: contacts.filter((c) => c.value.trim()) } : {}),
      ...(openingHours.length > 0 ? { openingHours } : {}),
      ...(attributes.length > 0 ? { attributes: attributes.filter((a) => a.key.trim()) } : {}),
      ...(parsedAreaCoordinates ? { areaCoordinates: parsedAreaCoordinates } : {}),
      ...(bboxMinLat ? { bboxMinLat: parseFloat(bboxMinLat) } : {}),
      ...(bboxMinLng ? { bboxMinLng: parseFloat(bboxMinLng) } : {}),
      ...(bboxMaxLat ? { bboxMaxLat: parseFloat(bboxMaxLat) } : {}),
      ...(bboxMaxLng ? { bboxMaxLng: parseFloat(bboxMaxLng) } : {}),
      ...(areaSqMeters ? { areaSqMeters: parseFloat(areaSqMeters) } : {}),
      ...(elevationMeters ? { elevationMeters: parseFloat(elevationMeters) } : {}),
      ...(buildingLevels ? { buildingLevels: parseInt(buildingLevels) } : {}),
      ...(establishedAt ? { establishedAt } : {}),
      ...(reviewReason ? { reviewReason } : {}),
    };

    try {
      const created = await createPlace(request);
      setFeedback(`Place created successfully — ID: ${created.id}`);
      // Reset form
      setNames([{ languageCode: "en", name: "", nameType: "PRIMARY", isPrimary: true }]);
      setCategoryId(""); setLatitude(""); setLongitude(""); setContacts([]); setOpeningHours([]); setAttributes([]);
      setStreetNameEn(""); setStreetNameAm(""); setStreetNumber(""); setReviewReason("");
      setAreaSqMeters(""); setElevationMeters(""); setBuildingLevels(""); setEstablishedAt("");
      setBboxMinLat(""); setBboxMinLng(""); setBboxMaxLat(""); setBboxMaxLng(""); setAreaCoordinatesStr("");
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
                {["POI","CAFE","RESTAURANT","HOTEL","SHOP","BANK","HOSPITAL","SCHOOL","GOVERNMENT","WORSHIP","TRANSPORT","PARK","OTHER"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl">Access Type <span>*</span></label>
              <select className="glass-select" value={accessType} onChange={(e) => setAccessType(e.target.value as AccessType)}>
                <option value="PUBLIC">PUBLIC</option><option value="PRIVATE">PRIVATE</option><option value="RESTRICTED">RESTRICTED</option>
              </select>
            </div>
          </div>
          <div className="fg">
            <label className="fl">Category ID <span>*</span></label>
            <input type="text" placeholder="UUID of the category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} />
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
                <option value="Point">Point</option><option value="Polygon">Polygon</option><option value="MultiPolygon">MultiPolygon</option>
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
            <div className="fg"><label className="fl">Established at</label><input type="datetime-local" value={establishedAt} onChange={(e) => setEstablishedAt(e.target.value)} /></div>
            <div className="fg">
              <label className="fl">Review Status</label>
              <select className="glass-select" value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value as ReviewStatus)}>
                <option value="PENDING">PENDING</option><option value="APPROVED">APPROVED</option><option value="FLAGGED">FLAGGED</option><option value="REJECTED">REJECTED</option>
              </select>
            </div>
          </div>
          {reviewStatus !== "PENDING" && (
            <div className="fg"><label className="fl">Review Reason</label><input type="text" placeholder="Manually verified by admin" value={reviewReason} onChange={(e) => setReviewReason(e.target.value)} /></div>
          )}
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
          <div className="ch"><span className="ct">Names</span><button type="button" className="btn sm" onClick={addName}><i className="ti ti-plus" />Add name</button></div>
          {names.map((n, i) => (
            <div key={i} className="fr" style={{ alignItems: "flex-end" }}>
              <div className="fg" style={{ width: 80 }}>
                <label className="fl">Lang</label>
                <select className="glass-select" value={n.languageCode} onChange={(e) => updateName(i, "languageCode", e.target.value)}>
                  <option value="en">en</option>
                  <option value="am">am</option>
                </select>
              </div>
              <div className="fg"><label className="fl">Name <span>*</span></label><input type="text" placeholder="Tomoca Coffee" value={n.name} onChange={(e) => updateName(i, "name", e.target.value)} /></div>
              <div className="fg" style={{ width: 120 }}><label className="fl">Type</label>
                <select className="glass-select" value={n.nameType} onChange={(e) => updateName(i, "nameType", e.target.value)}>
                  <option value="PRIMARY">PRIMARY</option><option value="LOCAL">LOCAL</option><option value="ALTERNATE">ALTERNATE</option><option value="OFFICIAL">OFFICIAL</option>
                </select>
              </div>
              <div className="fg" style={{ width: 60, display: "flex", alignItems: "center", gap: 4 }}>
                <label><input type="checkbox" checked={n.isPrimary} onChange={(e) => updateName(i, "isPrimary", e.target.checked)} /> 1°</label>
              </div>
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
              <div className="fg" style={{ width: 120 }}><label className="fl">Type</label>
                <select className="glass-select" value={c.type} onChange={(e) => updateContact(i, "type", e.target.value)}>
                  <option value="PHONE">PHONE</option><option value="EMAIL">EMAIL</option><option value="WEBSITE">WEBSITE</option><option value="FAX">FAX</option><option value="SOCIAL">SOCIAL</option>
                </select>
              </div>
              <div className="fg"><label className="fl">Value</label><input type="text" placeholder="+251911234567" value={c.value} onChange={(e) => updateContact(i, "value", e.target.value)} /></div>
              <div className="fg"><label className="fl">Label</label><input type="text" placeholder="Main Branch" value={c.label} onChange={(e) => updateContact(i, "label", e.target.value)} /></div>
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
                <select className="glass-select" value={h.weekday} onChange={(e) => updateHours(i, "weekday", parseInt(e.target.value))}>
                  {[1,2,3,4,5,6,7].map((d) => <option key={d} value={d}>{WEEKDAY_LABELS[d]}</option>)}
                </select>
              </div>
              <div className="fg"><label className="fl">Opens</label><input type="time" value={h.opensAt} onChange={(e) => updateHours(i, "opensAt", e.target.value)} /></div>
              <div className="fg"><label className="fl">Closes</label><input type="time" value={h.closesAt} onChange={(e) => updateHours(i, "closesAt", e.target.value)} /></div>
              <div className="fg" style={{ width: 60, display: "flex", alignItems: "center" }}><label><input type="checkbox" checked={h.is24Hours} onChange={(e) => updateHours(i, "is24Hours", e.target.checked)} /> 24h</label></div>
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
              <div className="fg"><label className="fl">Value</label><input type="text" placeholder="true" value={String(a.value)} onChange={(e) => updateAttribute(i, "value", e.target.value)} /></div>
              <div className="fg" style={{ width: 120 }}><label className="fl">Type</label>
                <select className="glass-select" value={a.valueType} onChange={(e) => updateAttribute(i, "valueType", e.target.value)}>
                  <option value="BOOLEAN">BOOLEAN</option><option value="STRING">STRING</option><option value="NUMBER">NUMBER</option><option value="JSON">JSON</option>
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
